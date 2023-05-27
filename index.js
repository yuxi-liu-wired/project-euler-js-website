const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();
const port = 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

rebuild_scripts(10);

app.get('/', (req, res) => {
  rebuild_site();
  const filePath = path.join(__dirname, 'pages', 'index.html');
  res.sendFile(filePath);
});

app.get('/problem/:id', (req, res) => {
  rebuild_site();
  const id = req.params.id;
  const filePath = path.join(__dirname, 'pages', 'problem', id);
  res.sendFile(filePath);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

function rebuild_scripts(problem_count) {
    if (!fs.existsSync("scripts")) {
        fs.mkdirSync("scripts", { recursive: true });
      }

      for (let n = 1; n <= problem_count; n++) {
      const filePath = path.join(__dirname, 'scripts', `${n}.js`);
  
      if (!fs.existsSync(filePath)) {
        const url = `https://projecteuler.net/minimal=${n}`;
        https.get(url, (response) => {
          let problemHtmlString = '';
          response.on('data', (chunk) => {
            problemHtmlString += chunk;
          });
          response.on('end', () => {
            const fileContent = `exports.statement = () => {
    return \`${problemHtmlString.trim()}\`;
};

exports.solution = () => {
    return 0;
};`;
            fs.writeFileSync(filePath, fileContent);
          });
        });
      }
    }
  }

function rebuild_site() {

    if (!fs.existsSync("pages/problem")) {
      fs.mkdirSync("pages/problem", { recursive: true });
    }
    
    let links = '';

    const files = fs.readdirSync(`${__dirname}/scripts`);
    files.forEach(file => {
      if (/[0-9]\.js$/.test(file)) {
        const problemNumber = path.basename(file, path.extname(file));
        const problemPath = path.join(__dirname, `scripts/${file}`);
        const pagePath = path.join(__dirname, `pages/problem/${problemNumber}.html`)
        
        // If the file has been modified or is new, re-run the problem solution
        const jsModTime = fs.statSync(problemPath).mtime;
        let htmlModTime;
        try {
            htmlModTime = fs.statSync(pagePath).mtime;
        } catch (error) {
            htmlModTime = null;
        }
        // console.log(`checking problem ${problemNumber}...`)
        // console.log(`jsModTime = ${jsModTime}, htmlModTime = ${htmlModTime}.`)
  
        if (!htmlModTime || jsModTime > htmlModTime) {
          delete require.cache[require.resolve(problemPath)];
          const problem = require(problemPath);
  
          try {
            console.log(`change detected in ${file}, regenerating solution...`)
            const statement = problem.statement();
            const solution = problem.solution();
            console.log(solution)
  
            // Regenerate the HTML
            const problemHtml = `<link rel="stylesheet" href="/style.css">
              <h1>Problem ${problemNumber}</h1>
              ${statement}<hr>
              <p>Solution: ${solution}</p>
              <a href="/">Back to index</a>
            `;
  
            fs.writeFileSync(`pages/problem/${problemNumber}.html`, problemHtml);
  
            console.log("Regeneration complete!")
          } catch (err) {
            console.error(`Error processing problem ${problemNumber}: ${err}`);
          }
        }
  
        links += `<a href="problem/${problemNumber}.html">Problem ${problemNumber}</a><br>`;
      }
    });
  
    const html = `<link rel="stylesheet" href="/style.css">
      <h1>Euler Problems</h1><hr>
      ${links}
    `;
    fs.writeFileSync(`pages/index.html`, html);
}