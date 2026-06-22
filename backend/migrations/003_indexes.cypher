CREATE INDEX resource_assessment_resource_type IF NOT EXISTS
FOR (ra:ResourceAssessment) ON (ra.resource_type);

CREATE INDEX uni_resource_is_active IF NOT EXISTS
FOR (r:UniResource) ON (r.is_active);

CREATE INDEX cpl_history_year IF NOT EXISTS
FOR (ch:CplHistory) ON (ch.year);

CREATE INDEX topic_lower_name IF NOT EXISTS
FOR (t:Topic) ON (t.lower_name);

CREATE CONSTRAINT migration_name IF NOT EXISTS
FOR (m:Migration) REQUIRE m.name IS UNIQUE;
