var os = require('os');
var http = require('http');
var fs = require('fs');


fs.readFile('./index.html', function (err, html) {
    if (err) {
        throw err;
    }
    http.createServer(function (request, response) {
        html = html.toString();
        html = html.replace("{{type}}", os.type());
        html = html.replace("{{hostname}}", os.hostname());
        html = html.replace("{{cpu_num}}", os.availableParallelism());
        html = html.replace("{{total_mem}}", os.totalmem() / 1048576 + "MB");

        response.writeHeader(200, { "Content-Type": "text/html" });
        response.write(html);
        response.end();
    }).listen(3000);
});