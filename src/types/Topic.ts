// Basic Topics / posts definitions
import { MemberProfile } from './profile';
// First post in a topic would have a Topic line and 
// topic id , createdBy, created_at, moderatorUser or Owner...
// First topic by def for all users should be under their profile
export interface PublicTopic {
    topicHeadline: string; // if first post in a topic description of the topic
    topicId: string; // for subbing to the topic
    topicModOwner: [userNickname: string, userId: MemberProfile]; // [Display name , User.id]
    topicVisibility: 'public' | 'private'; //
    topicMembers: [userNickname: string, userId: MemberProfile] [] // list of invited/ auth users
}

//  Dont think we need this, above can handle every case so far
// export interface PrivateTopic extends PublicTopic {
//     twitter?: string;
//     github?: string;
//     linkedin?: string;