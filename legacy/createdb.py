# Load PDF
# Split into chunks
# Create embeddings
# Store into Chroma

from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

load_dotenv()


# -----------------------------
# 1. Load PDF
# -----------------------------

loader = PyPDFLoader(
    "document loaders/deeplearning.pdf"
)

docs = loader.load()

print(f"Loaded {len(docs)} pages")


# -----------------------------
# 2. Split into chunks
# -----------------------------

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)

chunks = splitter.split_documents(docs)

print(f"Created {len(chunks)} chunks")


# -----------------------------
# 3. Create embeddings
# -----------------------------

embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


# -----------------------------
# 4. Store embeddings in Chroma
# -----------------------------

vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embedding_model,
    persist_directory="chroma_db"
)

print("✅ Chroma vector database created successfully!")