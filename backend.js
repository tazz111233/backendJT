const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import cors
const app = express();
const port = 5001;

app.use(cors()); // Enable CORS
app.use(express.json()); // To parse JSON body

mongoose.connect('mongodb+srv://tasneemmahmud2000:1122334455@cluster0.nti5kfn.mongodb.net/Jaanutuni?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Successfully connected to database'))
  .catch((err) => console.log('Failed to connect to database', err));

const personSchema = new mongoose.Schema({
  anyField: mongoose.Schema.Types.Mixed, // Allows any type of data
}, { strict: false }); // Allows saving data with any structure

const Person = mongoose.model('Items', personSchema);

// Route to save cart items
app.post('/save-cart', async (req, res) => {
  try {
    const person = new Person({name:req.body});
    await person.save();
    res.status(201).json({ message: 'Cart saved successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Error saving cart' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
