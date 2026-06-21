CREATE VECTOR INDEX resource_embedding_LazarusNLP_all_indo_e5_small_v4 IF NOT EXISTS
FOR (r:UniResource) ON (r.embedding_LazarusNLP_all_indo_e5_small_v4)
OPTIONS {
  indexConfig: {
    `vector.dimensions`: 384
  }
};
