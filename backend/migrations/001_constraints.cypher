CREATE CONSTRAINT cpl_id IF NOT EXISTS
FOR (c:Cpl)
REQUIRE c.cpl_id IS UNIQUE;
CREATE CONSTRAINT sub_cpl_id IF NOT EXISTS
FOR (sc:SubCpl)
REQUIRE sc.sub_cpl_id IS UNIQUE;
CREATE CONSTRAINT quality_id IF NOT EXISTS
FOR (q:Quality)
REQUIRE q.quality_id IS UNIQUE;
CREATE CONSTRAINT indicator_id IF NOT EXISTS
FOR (i:Indicator)
REQUIRE i.indicator_id IS UNIQUE;
CREATE CONSTRAINT question_id IF NOT EXISTS
FOR (qs:Question)
REQUIRE qs.question_id IS UNIQUE;
CREATE CONSTRAINT nrp IF NOT EXISTS
FOR (s:Student)
REQUIRE s.nrp IS UNIQUE;
CREATE CONSTRAINT major_id IF NOT EXISTS
FOR (m:Major)
REQUIRE m.major_id IS UNIQUE;
CREATE CONSTRAINT faculty_id IF NOT EXISTS
FOR (f:Faculty)
REQUIRE f.faculty_id IS UNIQUE;
CREATE CONSTRAINT batch_id IF NOT EXISTS
FOR (b:Batch)
REQUIRE b.batch_id IS UNIQUE;
CREATE CONSTRAINT study_level_id IF NOT EXISTS
FOR (s:StudyLevel)
REQUIRE s.study_level_id IS UNIQUE;
CREATE CONSTRAINT curriculum_version_id IF NOT EXISTS
FOR (c:CurriculumVersion)
REQUIRE c.curriculum_version_id IS UNIQUE;
CREATE CONSTRAINT resource_id IF NOT EXISTS
FOR (r:UniResource)
REQUIRE r.resource_id IS UNIQUE;
CREATE CONSTRAINT organizer_id IF NOT EXISTS
FOR (o:Organizer)
REQUIRE o.organizer_id IS UNIQUE;
CREATE CONSTRAINT admin_id IF NOT EXISTS
FOR (a:Admin)
REQUIRE a.admin_id IS UNIQUE;
CREATE CONSTRAINT topic_id IF NOT EXISTS
FOR (t:Topic)
REQUIRE t.topic_id IS UNIQUE;
CREATE CONSTRAINT author_type IF NOT EXISTS
FOR (cf:AuthorTypeRule)
REQUIRE cf.author_type IS UNIQUE;
CREATE CONSTRAINT impact_scale IF NOT EXISTS
FOR (cf:ImpactScaleRule)
REQUIRE cf.impact_scale IS UNIQUE;
CREATE CONSTRAINT thematic_weight IF NOT EXISTS
FOR (cf:ThematicWeightRule)
REQUIRE cf.thematic_weight IS UNIQUE;