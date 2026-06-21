CREATE INDEX resource_assessment_resource_type IF NOT EXISTS
FOR (ra:ResourceAssessment) ON (ra.resource_type);

CREATE CONSTRAINT migration_name IF NOT EXISTS
FOR (m:Migration) REQUIRE m.name IS UNIQUE;
