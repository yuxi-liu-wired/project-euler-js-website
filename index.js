const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const axios = require('axios');
const cheerio = require('cheerio');
const handlebars = require('handlebars');

const app = express();
const port = 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

rebuild_scripts(20);

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

// --------------------------------------------------------------------------------
// Getting answers
// --------------------------------------------------------------------------------
const answers = {};

if (fs.existsSync("answers.txt")) {
    const data = fs.readFileSync('answers.txt', 'utf8');
    const lines = data.split('\n');
    lines.forEach(line => {
        const [problemNumber, answer] = line.split('. ');
        answers[problemNumber] = parseInt(answer);
    });
}

// --------------------------------------------------------------------------------
// Webscraping
// --------------------------------------------------------------------------------

// Scrapes from Project Euler.
async function getProblemData(n) {
  const url = `https://projecteuler.net/problem=${n}`;
  const response = await axios.get(url);
  const html = response.data;

  const $ = cheerio.load(html);

  const title = $('h2').text();
  const problemContent = $('.problem_content').html();
  const tooltipContent = $('.tooltiptext_right').html();

  return { title, problemContent, tooltipContent };
}

// Rebuilds the scripts
async function rebuild_scripts(problem_count) {
  if (!fs.existsSync("scripts")) {
    fs.mkdirSync("scripts", { recursive: true });
  }

  for (let n = 1; n <= problem_count; n++) {
    const filePath = path.join(__dirname, 'scripts', `${n}.js`);

    if (!fs.existsSync(filePath)) {
      const problemData = await getProblemData(n);
      
      const fileContent = `exports.title = () => {
    return \`${problemData.title}\`;
};

exports.statement = () => {
    return \`${problemData.problemContent}\`;
};

exports.solution = () => {
    return 0;
};`;
      fs.writeFileSync(filePath, fileContent);
    }
  }
}

// Rebuilds the local HTML files.
function rebuild_site() {

    if (!fs.existsSync("pages/problem")) {
      fs.mkdirSync("pages/problem", { recursive: true });
    }
    
    const numbers = [];
    let titles = {};

    const files = fs.readdirSync(`${__dirname}/scripts`);
    // For each file in the `scripts` folder, generate corresponding page if necessary.
    files.forEach(file => {
      if (/[0-9]\.js$/.test(file)) {
        const problemNumber = path.basename(file, path.extname(file));
        numbers.push(parseInt(problemNumber));
        const problemPath = path.join(__dirname, `scripts/${file}`);
        const pagePath = path.join(__dirname, `pages/problem/${problemNumber}.html`)
        const problem = require(problemPath);
        const title = problem.title();
        titles[problemNumber] = title;

        // If the file has been modified or is new, re-run the problem solution
        const jsModTime = fs.statSync(problemPath).mtime;
        let htmlModTime;
        try {
            htmlModTime = fs.statSync(pagePath).mtime;
        } catch (error) {
            htmlModTime = null;
        }
  
        if (!htmlModTime || jsModTime > htmlModTime) {
          delete require.cache[require.resolve(problemPath)];
          const problem = require(problemPath);
  
          try {
            console.log(`change detected in ${file}, regenerating solution...`)
            const statement = problem.statement();
            const solution = problem.solution();

            // Regenerate the HTML
            const template = fs.readFileSync('template.hbs', 'utf8');
            const compiledTemplate = handlebars.compile(template);
            const problemHtml = compiledTemplate({ problemNumber, title, statement, solution, answer: answers[problemNumber] });
              
            fs.writeFileSync(`pages/problem/${problemNumber}.html`, problemHtml);
  
            console.log("Regeneration complete!")
          } catch (err) {
            console.error(`Error processing problem ${problemNumber}: ${err}`);
          }
        }
      }
    });
  
    // Generate `index.html`.
    numbers.sort(function (a, b) {  return a - b;  });

    let html = `<link rel="stylesheet" href="/style.css">
<h1>Euler Problems</h1><hr>`;
    for (const i of numbers) {
        html += `<a href="problem/${i}.html">Problem ${i}: ${titles[i]}</a><br>`;
    }

    fs.writeFileSync(`pages/index.html`, html);
}

