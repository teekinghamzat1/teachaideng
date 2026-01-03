const http = require("http");
const { exec } = require("child_process");

const SECRET = "696w8Y8ZmJ5xhVR9Ujus"; // optional, can leave empty

const server = http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/hook") {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {
            // Optional: verify secret here
            console.log("Received webhook, deploying...");
            exec("./deploy.sh", (err, stdout, stderr) => {
                if (err) {
                    console.error(`Deploy error: ${err}`);
                    return;
                }
                console.log(stdout);
            });

            res.end("OK");
        });
    } else {
        res.statusCode = 404;
        res.end();
    }
});

server.listen(3000, () => console.log("Webhook listener running on port 3000"));
