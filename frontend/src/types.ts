// Roles

import { type OutputData } from "@editorjs/editorjs";

export interface Student {
    nrp: string;
    name: string;
    email: string;
    picture?: string;
}

export interface Admin {
    admin_id: string;
    name: string;
    email: string;
    approved: boolean;
    picture?: string;
}

// Resource

export const ResourceType = {
  Book: "book",
  Video: "video",
  Event: "event",
  Article: "article",
}

export const ActorType = {
    Admin: "admin",
    Organizer: "organizer"
}

export const ResourceStatus = {
    Open: "open",
    Ongoing: "ongoing",
    Ended: "ended"
}

export const ResourceScale = {
    University: "university",
    Regional: "regional",
    National: "national",
    International: "international"
}

export const SpeakerDegree = {
    UniStudent: "university_student",
    Bachelor: "bachelor",
    Master: "master",
    Phd: "phd"
}

export interface Session {
    session_id: string;
    start_datetime: string;
    end_datetime: string;
}

export interface SessionInput {
    session_id?: string;
    start_datetime: string;
    end_datetime: string;
}

export interface ActorInput {
    actor_id: string;
    actor_type: typeof ActorType[keyof typeof ActorType]
}

export interface Resource {
    resource_id: string;
    type: typeof ResourceType[keyof typeof ResourceType];
    name: string;
    description?: string;
    authors?: string[];
    publisher?: string;
    published_date?: string;
    isbn?: string;
    content_link?: string;
    article_text?: string;
    study_levels?: StudyLevel[],
    sessions?: Session[],
    organizers: Organizer[],
    status: typeof ResourceStatus[keyof typeof ResourceStatus];
    scale: typeof ResourceScale[keyof typeof ResourceScale];
    speaker_degree: typeof SpeakerDegree[keyof typeof SpeakerDegree];
    is_active: boolean;
    topics: Topic[];
    calculations?: ResourceSupportCalculations;
}

// For edit / create
export interface ResourceInput {
    resource_id: string;
    type: typeof ResourceType[keyof typeof ResourceType];
    name: string;
    description?: string;
    authors?: string[];
    publisher?: string;
    published_date?: string;
    isbn?: string;
    content_link?: string;
    article_text?: OutputData;
    study_levels?: StudyLevel[],
    sessions?: SessionInput[],
    organizers?: ResourceOrganizerInput[],
    status?: typeof ResourceStatus[keyof typeof ResourceStatus];
    scale?: typeof ResourceScale[keyof typeof ResourceScale];
    speaker_degree?: typeof SpeakerDegree[keyof typeof SpeakerDegree];
    is_active: boolean;
    indicators: ResourceIndicator[];
    topics: ResourceTopic[];
}

export interface ResourceTopic {
    topic_id: string;
}

export interface ResourceSubCpl {
    sub_cpl_id: string;
}

export interface ResourceIndicator {
    indicator_id: string;
}

export interface ResourceRecommendation{
    resource:  Resource;
    probability_score?: number;
}

export interface ResourceRecommendations{
    message: string;
    count: number;
    recommendations: ResourceRecommendation[]
}

export interface ResourceSupportCalculations{
    indicators: IndicatorSupport[]
    qualities: Quality[]
    subcpls: SubCplSupport[]
}

// Curriculum

export interface Quality {
    quality_id: string;
    code: string;
    name: string;
    weight: number;
}

export interface Question {
    question_id: string;
    code: string;
    name: string;
}

export interface Indicator {
    indicator_id: string;
    code: string;
    name: string;
}

export interface IndicatorSupport {
    indicator_id: string;
    code: string;
    name: string;
    weight: number;
}

export interface SubCplSupport {
    sub_cpl_id: string;
    code: string;
    name: string;
    weight: number;
}

export interface CplSupport {
    cpl_id: string;
    code: string;
    name: string;
    weight: number;
}

export interface SubCpl {
    sub_cpl_id: string;
    code: string;
    name: string;
    indicators: Indicator[];
}

export interface CPL {
    cpl_id: string;
    code: string;
    name: string;
    subcpls: SubCpl[];
}

export interface Curriculum {
    curriculum: CPL[]
}

export interface Topic {
    topic_id: string;
    code: string;
    name: string;
}

export interface StudyLevel {
    study_level_id: number;
}

export interface Organizer {
    organizer_id: string;
    name: string;
}

export interface OrganizerInput {
    name: string;
}

export interface ResourceOrganizerInput {
    organizer_id: string;
}

export interface CurriculumVersion {
    curriculum_version_id: number;
}

export interface SupportLackGap {
    id: string;
    code: string;
    name: string;
    resource_count: number;
    lack_score: number;
    avg_lack_score: number;
    student_count: number;
    support_score: number;
    avg_support_score: number;
}

export interface ResourceSupportingX {
    resource_name: string;
    resource_type: typeof ResourceType[keyof typeof ResourceType];
    organizers: string[];
    topics: string[];
    status: string;
    attendees: number; 
}

export interface Dashboard {
    support_lack_gap: SupportLackGap[];
    resource_supporting_x: ResourceSupportingX[];
}

export interface ResourceCharacteristic {
    resource_id: string;
    sub_cpl_count: number;
    sub_cpl_avg_support: number;
}