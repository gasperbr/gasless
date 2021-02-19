const express = require('express');

const app = express();

app.get('/trade-output', (req, res) => res.send('Home Page Route'));

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Server running on ${port}, http://localhost:${port}`));
