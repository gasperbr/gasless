/* const express = require('express');

const app = express();

app.get('/trade-output', (req, res) => res.send('Home Page Route'));

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Server running on ${port}, http://localhost:${port}`));
 */
const app = require('express')()
const { v4 } = require('uuid')

app.get('/api', (req, res) => {
  const path = `/api/item/${v4()}`
  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate')
  res.end(`Hello! Go to item: <a href="${path}">${path}</a>`)
})

app.get('/api/item/:slug', (req, res) => {
  const { slug } = req.params
  res.end(`Item: ${slug}`)
})

module.exports = app
