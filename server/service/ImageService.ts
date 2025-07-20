export function buildCoverImageUrl(eventId: string,filename: string) {
    return `public/events/${eventId}/cover/${filename}`;
}

export function getCoverImageFolder(eventId: string) {
    return `public/events/${eventId}/cover/`;
}

export function getUploadedPictureFolder(eventId: string) {
    return `public/events/${eventId}/pictures/`;
}

export function buildUploadedPictureUrl(eventId: string, filename: string) {
    return `public/events/${eventId}/pictures/${filename}`;
}