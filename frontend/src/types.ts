// Roles

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

export interface Resource {
    resource_id: string;
    type: typeof ResourceType[keyof typeof ResourceType];
    name: string;
    description: string;
    sessions?: Session[],
    status: typeof ResourceStatus[keyof typeof ResourceStatus];
    scale: typeof ResourceScale[keyof typeof ResourceScale];
    speaker_degree: typeof SpeakerDegree[keyof typeof SpeakerDegree];
    is_active: boolean;
    subcpls: SubCpl[];
    topics: Topic[];
    calculations?: ResourceSupportCalculations;
}

// For edit / create
export interface ResourceInput {
    resource_id: string;
    type: typeof ResourceType[keyof typeof ResourceType];
    name: string;
    description: string;
    sessions?: SessionInput[],
    status?: typeof ResourceStatus[keyof typeof ResourceStatus];
    scale?: typeof ResourceScale[keyof typeof ResourceScale];
    speaker_degree?: typeof SpeakerDegree[keyof typeof SpeakerDegree];
    is_active: boolean;
    subcpls: ResourceSubCpl[];
    topics: ResourceTopic[];
}

export interface ResourceTopic {
    topic_id: string;
}

export interface ResourceSubCpl {
    sub_cpl_id: string;
    indicators: ResourceIndicator[];
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

export interface Organizer {
    organizer_id: string;
    name: string;
}

export interface OrganizerInput {
    name: string;
}