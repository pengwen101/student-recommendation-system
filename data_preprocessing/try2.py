import nltk
from nltk.corpus import wordnet as wn

# Download wordnet if you haven't already
# nltk.download('wordnet')

def find_high_similarity_words(target_synset_id, threshold=0.9):
    # 1. Get the target synset object
    try:
        target_synset = wn.synset(target_synset_id)
    except Exception as e:
        return f"Error finding synset: {e}. Remember to use underscores for spaces."
    
    target_pos = target_synset.pos()  # Get part of speech (e.g., 'n')
    results = []
    
    # 2. Loop through ALL synsets in WordNet that match the target part of speech
    for synset in wn.all_synsets(pos=target_pos):
        # 3. Calculate Wu-Palmer similarity
        score = target_synset.path_similarity(synset)
        
        # 4. Check if score meets the threshold (handling potential None values)
        if score is not None and score >= threshold:
            # Extract all word variations (lemmas) for this meaning
            for lemma in synset.lemma_names():
                # Replace underscores with spaces for clean human reading
                word = lemma.replace('_', ' ')
                # Save the word, its specific meaning, and the exact score
                results.append((word, synset.name(), round(score, 4)))
                
    # Remove exact duplicate words from the list, keeping the highest score
    unique_results = {}
    for word, synset_name, score in results:
        if word not in unique_results or score > unique_results[word][1]:
            unique_results[word] = (synset_name, score)
            
    # Sort the final list by score in descending order
    return sorted(unique_results.items(), key=lambda x: x[1][1], reverse=True)

# --- Run the Function ---
# Find words highly similar to 'computer_science.n.01'
target_word = wn.synset('church.n.01')
word_2 = wn.synset("Christianity.n.01")
sim = target_word.path_similarity(word_2)

print(sim)
# matches = find_high_similarity_words(target_word, threshold=0.5)

# print(f"Words with a Wu-Palmer score > 0.9 for '{target_word}':\n")
# for word, (synset, score) in matches:
#     print(f"- {word:<25} (Synset: {synset}, Score: {score})")




# def is_generic_human(word):
#     synsets = wn.synsets(word, pos=wn.NOUN)
#     if not synsets:
#         return False
#     # Check if the primary definition belongs to generic "person" top-level synsets
#     lexname = synsets[0].lexname()
#     print(lexname)
#     return lexname in ['noun.person', 'noun.group']

# print(is_generic_human("business_intelligence"))