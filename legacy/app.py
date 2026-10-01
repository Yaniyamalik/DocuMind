import os
import tempfile

import streamlit as st
from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate


# Load environment variables
load_dotenv()


# Streamlit Configuration


st.set_page_config(
    page_title="RAG Book Assistant",
    page_icon="📚",
    layout="wide"
)

st.title("📚 RAG Book Assistant")
st.write("Upload a PDF and ask questions from the document.")


# API Key Check


if not os.getenv("GROQ_API_KEY"):
    st.error("GROQ_API_KEY not found. Add it to your .env file.")
    st.stop()



# PDF Upload


uploaded_file = st.file_uploader(
    "Upload a PDF book",
    type=["pdf"]
)



# Create Vector Database


if uploaded_file:

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".pdf"
    ) as tmp_file:

        tmp_file.write(uploaded_file.read())
        file_path = tmp_file.name

    st.success("PDF uploaded successfully!")

    if st.button("Create Vector Database"):

        with st.spinner("Processing document..."):

            # Load PDF
            loader = PyPDFLoader(file_path)
            docs = loader.load()

            # Split document
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )

            chunks = splitter.split_documents(docs)

            st.write(f"📄 Pages loaded: {len(docs)}")
            st.write(f"🧩 Chunks created: {len(chunks)}")

            
            # Embedding Model
            

            embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )

            # Chroma Vector Store
            

            vectorstore = Chroma.from_documents(
                documents=chunks,
                embedding=embeddings,
                persist_directory="chroma_db"
            )

        st.success("✅ Vector database created successfully!")



# Load Existing Vector Database


if os.path.exists("chroma_db"):

    # Embedding model
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    # Load Chroma
    vectorstore = Chroma(
        persist_directory="chroma_db",
        embedding_function=embeddings
    )

    # Retriever
   

    retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": 4,
            "fetch_k": 10,
            "lambda_mult": 0.5
        }
    )

    
    # Groq LLM
  

    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0
    )

    # -----------------------------
    # Prompt
    # -----------------------------

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """
You are a helpful AI assistant.

Answer the user's question using ONLY the provided context.

If the answer is not present in the context, say:

"I could not find the answer in the document."

Do not make up information.
"""
            ),
            (
                "human",
                """
Context:

{context}

Question:

{question}
"""
            )
        ]
    )

    # Question Answering UI
   

    st.divider()

    st.subheader("🔎 Ask Questions From the Book")

    query = st.text_input(
        "Enter your question"
    )

    if query:

        with st.spinner("Searching the document..."):

            # Retrieve relevant chunks
            docs = retriever.invoke(query)

            # Create context
            context = "\n\n".join(
                doc.page_content
                for doc in docs
            )

            # Create prompt
            final_prompt = prompt.invoke(
                {
                    "context": context,
                    "question": query
                }
            )

            # Generate answer
            response = llm.invoke(final_prompt)

        st.subheader("🤖 AI Answer")

        st.write(response.content)

        # Sources
        

        with st.expander("📖 Retrieved Sources"):

            for i, doc in enumerate(docs):

                st.markdown(
                    f"**Source {i + 1}**"
                )

                st.write(
                    doc.page_content
                )

                if doc.metadata:
                    st.caption(
                        f"Metadata: {doc.metadata}"
                    )