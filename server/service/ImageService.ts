// TODO :  verify that the file is publicly accessible
export function buildCoverImageUrl(filename: string) {
    return `public/events-cover/${filename}`;
}

export function getCoverImageFolder() {
    return 'public/events-cover/';
}