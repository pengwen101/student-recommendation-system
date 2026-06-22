CREATE VECTOR INDEX resource_embedding IF NOT EXISTS
FOR (r:UniResource) ON (r.embedding)
OPTIONS {
  indexConfig: {
    `vector.dimensions`: 384
  }
};
