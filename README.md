# Project Euler Starter Pack: Javascript Edition

Starter pack for [Project Euler](https://projecteuler.net/archives). Written in Javascript, running on node.js, locally hosted in an aesthetically elegant website.

## How to use

* Install `Node.js` and `npm`
* `git clone` the repository.

```bash
cd project-euler-js-website
npm init -y
npm install express
node index.js
```

Now open `localhost:3000` in your browser. The first loading would take a while as it generates all the html pages, but after that it would only regenerate the pages if you update the corresponding `js` file.

Every time you finish a `js` file in the `scripts` folder, just refresh any page, and the server would run the `js` file, get the answer, then generate the corresponding `html` file. Note that if you accidentally made an infinite loop, you're out of luck and would have to kill the server. I would have coded in an automatic time-out, but it's hard to figure out how long to wait, since some problems could take minutes to finish computing, so please just use your own judgment.

To get started, the `scripts` folder contains the first 100 problems. Just replace the `0` in this function:
```javascript
exports.solution = () => {
    return 0;
};
```

You can just run this once and 

You can find [solutions online](https://github.com/luckytoilet/projecteuler-solutions/blob/master/Solutions.md). I don't think it's cheating to have numerical solutions. After all, you still have to code up your solutions.

## Credits

The CSS file used is MIT licensed from [`Simple.css` by Kev Quirk](https://github.com/kevquirk/simple.css).