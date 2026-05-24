CALL n10s.rdf.import.fetch("file:///var/lib/neo4j/import/english-wordnet-2025.ttl.gz","Turtle");

MATCH (le:ns2__LexicalEntry)-[:ns3__partOfSpeech]->(pos)
WITH le, apoc.text.join([x in split(apoc.text.replace(pos.uri,".*#(.*)$","$1"),"_") | apoc.text.capitalize(x)],"") AS posAsString
SET le.partOfSpeech = posAsString 
WITH le, posAsString
CALL apoc.create.addLabels(le, [posAsString]) YIELD node
RETURN count(node);

MATCH (r:Resource { uri: "https://en-word.net/"}) DETACH DELETE r;

MATCH (n:ns2__LexicalConcept)-[:ns3__definition]-(def)
with n, collect(distinct def.rdf__value) as definitions
SET n.ns3__definition = definitions[0];

MATCH (le:ns2__LexicalEntry)
WITH le, apoc.text.replace(split(split(le.uri, "/lemma/")[1], "#")[0], "_", " ") AS extractedWord
SET le.lemma = extractedWord

WITH le
MERGE (f:Resource { uri: apoc.text.replace(le.uri, "^(.*)#.*$", "$1") })
ON CREATE SET f.writtenRep = le.lemma, f:ns2__Form
MERGE (le)-[:ns2__canonicalForm]->(f);

CALL apoc.periodic.iterate(
  "MATCH (le:ns2__LexicalEntry) RETURN le",
  "WITH le, apoc.text.replace(split(split(le.uri, '/lemma/')[1], '#')[0], '_', ' ') AS extractedWord
   SET le.lemma = extractedWord
   WITH le, extractedWord
   MERGE (f:Resource { uri: apoc.text.replace(le.uri, '^(.*)#.*$', '$1') })
   ON CREATE SET f.writtenRep = extractedWord, f:ns2__Form
   MERGE (le)-[:ns2__canonicalForm]->(f)",
  {batchSize: 5000, parallel: false}
);