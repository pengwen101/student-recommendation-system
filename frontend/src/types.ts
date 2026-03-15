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

export interface Resource {
    resource_id: string;
    type: typeof ResourceType[keyof typeof ResourceType];
    name: string;
    description: string;
    start_datetime: string;
    end_datetime: string;
    status: typeof ResourceStatus[keyof typeof ResourceStatus];
    is_active: boolean;
    subcpls?: SubCpl[];
    topics?: Topic[];
    calculated_qualities?: CalculatedQuality[]
}

// For edit / create
export interface ResourceInput {
    resource_id: string;
    type: typeof ResourceType[keyof typeof ResourceType];
    name: string;
    description: string;
    start_datetime: string;
    end_datetime: string;
    status: typeof ResourceStatus[keyof typeof ResourceStatus];
    is_active: boolean;
    subcpls?: ResourceSubCpl[];
    topics?: ResourceTopic[];
}

export interface ResourceTopic {
    topic_id: string;
}

export interface ResourceSubCpl {
    sub_cpl_id: string;
    qualities: ResourceQuality[];
}

export interface ResourceQuality {
    quality_id: string;
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

export interface CalculatedQuality {
    quality_id: string;
    code: string;
    name: string;
    weight: number;
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

export interface SubCpl {
    sub_cpl_id: string;
    code: string;
    name: string;
    qualities: Quality[];
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
    weight: number;
}