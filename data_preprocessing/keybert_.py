import spacy
from keybert import KeyBERT
from sklearn.feature_extraction.text import TfidfVectorizer
from rake_nltk import Rake
import yake
import pytextrank

text = "Content Writing Workshop In this workshop, you are taught how to use the knowledge of writing (microblog, content writing, script writing, captions) obtained from the English Literature and Communication Studies study program, into a series of steps to understand and interpret basic ideas as a whole, carry out problem analysis, create ideas/ideas for solutions to the problem, and express them in writing/layout form. Meanwhile, we will train them to write in full by starting from their personal reflections according to their faith in the Lord Jesus, building a common ground of basic ideas, and presenting them in writing that is grounded and easy to understand."

additional_stop_words = ['students', "student", "people"]

# ==========================================
# 1. KeyBERT
# ==========================================
print("--- 1. KeyBERT ---")
kw_model = KeyBERT()
keywords_tuple = kw_model.extract_keywords(text, stop_words=additional_stop_words, top_n=15)
keybert_keywords = [kw[0] for kw in keywords_tuple]
print(keybert_keywords)


# ==========================================
# 2. SpaCy (Noun Chunks) - Original Method
# ==========================================
print("\n--- 2. SpaCy Noun Chunks ---")
nlp = spacy.load("en_core_web_sm")

# Adding your entityLinker pipe (requires spacy-entity-linker)
if "entityLinker" not in nlp.pipe_names:
    try:
        nlp.add_pipe("entityLinker", last=True)
    except Exception as e:
        pass # Skips if not installed

sentences = [sentence.strip() for sentence in text.split(".")]
noun_chunk_results = []

for sentence in sentences:
    if not sentence: continue
    doc = nlp(sentence)
    for chunk in doc.noun_chunks:
        root = chunk.root
        if root.pos_ in ("PRON", "DET"):
            continue
        lemma = root.lemma_.lower()
        if lemma not in additional_stop_words and lemma not in noun_chunk_results:
            noun_chunk_results.append(lemma)

# Limiting to top 10
print(noun_chunk_results)

entity_chunk_results = []
for entity in doc._.linkedEntities:
    span_text = entity.get_span().text
    if span_text.lower() not in additional_stop_words:
        entity_chunk_results.append(span_text.lower())
        

print("\n--- 2. SpaCy Entity Chunks ---")
print(entity_chunk_results)

# ==========================================
# 3. TF-IDF (Scikit-Learn)
# ==========================================
print("\n--- 3. TF-IDF ---")
# We use max_features=10 to strictly get the top 10 keywords.
# Note: TF-IDF is traditionally used on large corpora. On a single document, 
# it effectively behaves like Term Frequency (TF).
vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2), max_features=15)
vectorizer.fit_transform([text])
tfidf_keywords = vectorizer.get_feature_names_out().tolist()
print(tfidf_keywords)


# ==========================================
# 4. RAKE (rake-nltk)
# ==========================================
print("\n--- 4. RAKE ---")
# RAKE uses standard english stopwords by default
rake_extractor = Rake()
rake_extractor.extract_keywords_from_text(text)
rake_keywords = rake_extractor.get_ranked_phrases()[:15]
print(rake_keywords)


# ==========================================
# 5. TextRank (via pytextrank and SpaCy)
# ==========================================
print("\n--- 5. TextRank ---")
nlp_tr = spacy.load("en_core_web_sm")
# Add pytextrank to the pipeline
nlp_tr.add_pipe("textrank")
doc_tr = nlp_tr(text)

textrank_keywords = [phrase.text for phrase in doc_tr._.phrases[:15]]
print(textrank_keywords)


# ==========================================
# 6. YAKE (Yet Another Keyword Extractor)
# ==========================================
print("\n--- 6. YAKE ---")
# n=3 extracts unigrams, bigrams, and trigrams
yake_extractor = yake.KeywordExtractor(lan="en", n=3, dedupLim=0.9, top=15, features=None)
yake_tuples = yake_extractor.extract_keywords(text)
yake_keywords = [kw[0] for kw in yake_tuples]
print(yake_keywords)