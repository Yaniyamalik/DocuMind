import os
import tempfile

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()
if not os.getenv("GROQ_API_KEY"):
    raise RuntimeError("GROQ_API_KEY not found. Add it to your .env file.")

DB_DIR = "chroma_db"

# Loaded once at startup (much faster than Streamlit reloading on every rerun)
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
llm = ChatGroq(model=os.getenv("GROQ_MODEL", "openai/gpt-oss-20b"), temperature=0)
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful AI assistant.\n"
            "Answer the user's question using ONLY the provided context.\n"
            'If the answer is not present in the context, say: '
            '"I could not find the answer in the document."\n'
            "Do not make up information.",
        ),
        ("human", "Context:\n\n{context}\n\nQuestion:\n\n{question}"),
    ]
)

app = FastAPI(title="RAG Book Assistant API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_store() -> Chroma:
    return Chroma(persist_directory=DB_DIR, embedding_function=embeddings)


class Question(BaseModel):
    question: str


@app.get("/status")
def status():
    return {"ready": os.path.exists(DB_DIR)}


@app.post("/upload")
def upload(file: UploadFile = File(...)):
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(file.file.read())
        path = tmp.name

    try:
        docs = PyPDFLoader(path).load()
    finally:
        os.remove(path)

    for d in docs:
        d.metadata["source"] = file.filename

    chunks = splitter.split_documents(docs)
    if not chunks:
        raise HTTPException(400, "No text found in this PDF (scanned?).")

    # Replace the previous book with the new one
    try:
        get_store().delete_collection()
    except Exception:
        pass
    get_store().add_documents(chunks)

    return {"filename": file.filename, "pages": len(docs), "chunks": len(chunks)}


@app.post("/ask")
def ask(q: Question):
    if not os.path.exists(DB_DIR):
        raise HTTPException(400, "Upload a PDF first.")

    retriever = get_store().as_retriever(
        search_type="mmr",
        search_kwargs={"k": 4, "fetch_k": 10, "lambda_mult": 0.5},
    )
    docs = retriever.invoke(q.question)
    context = "\n\n".join(d.page_content for d in docs)
    response = llm.invoke(prompt.invoke({"context": context, "question": q.question}))

    return {
        "answer": response.content,
        "sources": [
            {
                "content": d.page_content,
                "page": (d.metadata.get("page", 0) + 1),
                "source": d.metadata.get("source"),
            }
            for d in docs
        ],
    }
