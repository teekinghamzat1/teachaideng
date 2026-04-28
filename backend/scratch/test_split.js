const topic = "ai lesson plan generator, automated lesson note creation, artificial intelligence for teachers";
const topicsToAdd = topic.split(/[\n,]/).map(t => t.trim()).filter(t => t.length > 0);
console.log("Count:", topicsToAdd.length);
console.log("Topics:", topicsToAdd);
