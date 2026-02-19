export interface User {
    student_id: string;
    name: string;
    email: string;
    picture?: string;
}

export interface EventItem {
    event_id: string;
    event_name: string;
    probability_score?: number;
}

export interface Quality {
    quality_id: string;
    quality_description: string;
    lack_value: number;
}

export interface Topic {
    topic_id: string;
    topic_description: string;
    weight: number;
}