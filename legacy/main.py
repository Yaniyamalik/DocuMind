from dotenv import load_dotenv

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate


load_dotenv()



# Embedding Model


embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


# Load ChromaDB


vectorstore = Chroma(
    persist_directory="chroma_db",
    embedding_function=embedding_model
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


# Prompt Template


prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are a helpful AI assistant.

Use ONLY the provided context to answer the question.

If the answer is not present in the context,
say:

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


print("✅ RAG system created")
print("Type 0 to exit")



# Question Answering Loop


while True:

    query = input("\nYou: ")

    if query == "0":
        print("Exiting...")
        break

    # Retrieve relevant documents
    docs = retriever.invoke(query)

    # Create context
    context = "\n\n".join(
        doc.page_content
        for doc in docs
    )

    # Create final prompt
    final_prompt = prompt.invoke(
        {
            "context": context,
            "question": query
        }
    )

    # Generate answer
    response = llm.invoke(final_prompt)

    print("\n🤖 AI:")
    print(response.content)

    # Show retrieved sources
    print("\n📚 Retrieved Sources:")

    for i, doc in enumerate(docs, start=1):

        print(f"\n--- Source {i} ---")
        print(doc.page_content[:500])