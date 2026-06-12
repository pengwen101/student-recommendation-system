from sentence_transformers import SentenceTransformer

embedding_model = None

def load_state():
    global embedding_model
    
    embedding_model = SentenceTransformer("LazarusNLP/all-indo-e5-small-v4")