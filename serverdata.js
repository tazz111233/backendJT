const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const multer = require('multer');

const fs = require('fs');
const path = require('path');
const uploadDir = path.join(__dirname, 'img'); // Path to your 'img' folder
let usernamep;

const app = express();
const PORT = 5001;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' })); // Replace with your frontend URL
app.use(express.json());
app.use('/images', express.static(uploadDir));

// File Storage Setup using Multer
if (!fs.existsSync(uploadDir)) {
  // Create the folder if it doesn't exist
  fs.mkdirSync(uploadDir);
}

// Multer setup for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save images to the 'img' folder
    cb(null, path.join(__dirname, 'img'));
  },
  filename: (req, file, cb) => {
    // Use the original file name or add a timestamp to avoid name collisions
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Path to the products JSON file
const productsFilePath = path.join(__dirname, 'products.json');

// Helper function to read and write JSON file
const readProductsFile = () => {
  try {
    const data = fs.readFileSync(productsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading products file:', error);
    return [];
  }
};

const writeProductsFile = (data) => {
  try {
    fs.writeFileSync(productsFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing products file:', error);
  }
};

// MongoDB Connection
mongoose.connect('mongodb+srv://tasneemmahmud2000:1122334455@cluster0.nti5kfn.mongodb.net/Jaanutuni?retryWrites=true&w=majority&appName=Cluster0',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s
  }
)
  .then(() => console.log('Successfully connected to database'))
  .catch((err) => console.error('Failed to connect to database', err));

// User Schema and Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullname: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);
const discountCodeSchema = new mongoose.Schema({
  discountCode: { type: String, required: true, unique: true },
  celebrityName: { type: String, required: true },
  usageCount: { type: Number, required: true, min: 0 },
  value: { type: Number, required: true }, // New field for the discount value (percentage or fixed amount)
  status: { type: String, required: true },
});

const DiscountCode = mongoose.model('DiscountCode', discountCodeSchema);



// Person Schema and Model
const personSchema = new mongoose.Schema({
  anyField: mongoose.Schema.Types.Mixed,
}, { strict: false });

const Person = mongoose.model('Items', personSchema);

const productSchema = new mongoose.Schema({
  id: { type: Number, unique: true }, // Auto-incremented ID
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  stock: { type: Number, required: true },
  number: { type: Number, required: true },
  image: { type: String, required: true }, // Store the image file path
});

const Product = mongoose.model('Product', productSchema);



// Routes

app.patch('/update-discount-status/:discountCode', async (req, res) => {
  const { discountCode } = req.params;  // Retrieve the discount code from the URL parameter
  const { status } = req.body;          // Retrieve the status from the request body

  try {
    // Find the discount code in the database
    const discountCodeRecord = await DiscountCode.findOne({ discountCode });

    if (discountCodeRecord) {
      // Update the status
      discountCodeRecord.status = status;

      // Save the updated document back to the database
      await discountCodeRecord.save();

      // Respond with a success message
      res.status(200).json({ message: 'Discount code status updated successfully.' });
    } else {
      // If the discount code doesn't exist, return a 404 error
      res.status(404).json({ error: 'Discount code not found.' });
    }
  } catch (error) {
    // Handle any unexpected errors
    console.error('Error updating discount code status:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/get-question-answer/:username', async (req, res) => {
  const { username } = req.params;

  try {
    // Fetch the user from the database based on the username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Send the question and answer back to the client
    res.status(200).json({
      question: user.question,
      answer: user.answer
    });
  } catch (error) {
    console.error('Error retrieving question and answer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password endpoint
app.put('/change-password', async (req, res) => {
  const { username, newPassword } = req.body;

  try {
    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});
app.get('/getAllProducts', async (req, res) => {
  try {
    const products = await Product.find();  // Get all products from the database
    res.status(200).json(products);  // Return the products as JSON
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving products', error });
  }
});
// Endpoint to update the product stock
app.patch('/products/:productId', (req, res) => {
  const { productId } = req.params;
  const { stock } = req.body;

  // Find the product by ID
  const product = products.find(p => p.id === parseInt(productId));
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Update the product stock
  product.stock = stock;

  return res.status(200).json({ message: 'Stock updated successfully', product });
});

// Get all discount codes
app.get('/discounts', async (req, res) => {
  try {
    const { discountCode } = req.query;

    // Fetch discount code from database with status as "Active"
    const discount = await DiscountCode.findOne({ 
      discountCode, 
      status: 'Active'  // Ensure the discount code is active
    });

    if (!discount) {
      return res.status(404).json({ error: 'Invalid or inactive discount code' });
    }

    res.status(200).json({ discounts: [discount] }); // Return the discount
  } catch (error) {
    console.error('Error retrieving discount code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/discount-codes', async (req, res) => {
  try {
    const discountCodes = await DiscountCode.find(); // Retrieve all discount codes from the database
    res.status(200).json(discountCodes); // Send the discount codes as a JSON response
  } catch (error) {
    console.error('Error retrieving discount codes:', error);
    res.status(500).json({ error: 'An unexpected error occurred while retrieving discount codes' });
  }
});

app.get('/discountscodes', async (req, res) => {
  try {
    const discountCodeQuery = req.query.discountCode;
    let discountCodes;

    if (discountCodeQuery) {
      discountCodes = await DiscountCode.find({ discountCode: discountCodeQuery });
    } else {
      discountCodes = await DiscountCode.find();
    }

    res.status(200).json(discountCodes);
  } catch (error) {
    console.error('Error retrieving discount codes:', error);
    res.status(500).json({ error: 'An unexpected error occurred while retrieving discount codes' });
  }
});

app.post('/add-discount', async (req, res) => {
  try {
    const { discountCode, celebrityName, usageCount, value, status } = req.body;

    // Input validation
    if (!discountCode || !celebrityName || typeof usageCount !== 'number' || usageCount < 0 || typeof value !== 'number' || value <= 0) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    // Set default status to "Active" if not provided
    const discountStatus = 'Active';

    // Create a new discount code document
    const newDiscount = new DiscountCode({
      discountCode,
      celebrityName,
      usageCount,
      value, // Include the discount value
      status: discountStatus, // Use provided status or default to "Active"
    });

    // Save the new discount code to the database
    await newDiscount.save();

    res.status(201).json({ message: 'Discount code added successfully', discount: newDiscount });
  } catch (error) {
    console.error('Error adding discount code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/incrementProductViews', async (req, res) => {
  const { productName } = req.body;

  if (!productName) {
    return res.status(400).json({ message: 'Product name is required' });
  }

  try {
    // Find the product by name and increment the views field
    const product = await Product.findOneAndUpdate(
      { name: productName },  // Find the product by its name
      { $inc: { number: 1 } },  // Increment the views field by 1
      { new: true }  // Return the updated product
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product views incremented', product });
  } catch (error) {
    res.status(500).json({ message: 'Error incrementing product views', error });
  }
});

app.post('/increment-discount-usage', async (req, res) => {
  const { code } = req.body;

  try {
    // Find the discount code in the database
    const discountCode = await DiscountCode.findOne({ code });

    if (!discountCode) {
      return res.status(400).json({ message: 'Discount code not found.' });
    }

    // Increment the usage count
    discountCode.usageCount += 1;
    await discountCode.save();

    res.json({ message: 'Discount usage count incremented successfully.' });
  } catch (error) {
    console.error('Error incrementing discount usage:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/images/:imageName', (req, res) => {
  const { imageName } = req.params;
  const imagePath = path.join(uploadDir, imageName);

  // Check if the file exists
  if (fs.existsSync(imagePath)) {
    return res.sendFile(imagePath);
  } else {
    return res.status(404).send('Image not found');
  }
});

// Create Product with Image and Update products.json
// POST endpoint to add a new product
app.post('/products', upload.single('image'), async (req, res) => {
  const { name, price , category, stock } = req.body;
  const image = req.file ? `/img/${req.file.filename}` : null;
  const number = 0;

  if (!name || !price || !image || !category || !stock) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Fetch the highest ID from MongoDB (if products exist)
    const lastProduct = await Product.findOne().sort({ id: -1 }).exec();
    const newId = lastProduct ? lastProduct.id + 1 : 1; // Increment last ID or start from 1 if no products exist

    // Create a new product document for MongoDB
    const newProduct = new Product({
      name,
      price: parseFloat(price),
      image,
      category,
      number,
      stock: parseFloat(stock),
      id: newId, // Assign the new ID
    });

    console.log(newProduct);

    // Save the new product to the database
    await newProduct.save();

    // Load existing products from products.json
    const products = readProductsFile();

    // Add the new product to the products array with correct ID
    const productWithId = {
      ...newProduct.toObject(),
      id: newId, // Ensure the same ID is assigned in both places
    };

    // Add the new product to the array
    products.push(productWithId);

    // Save the updated products array to the products.json file
    writeProductsFile(products);

    res.status(201).json({
      message: 'Product added successfully',
      product: productWithId,
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'An unexpected error occurred while adding the product' });
  }
});



// Serve static files (e.g., images)
app.use('/img', express.static(path.join(__dirname, 'img')));


// Get All Products
app.get('/products', (req, res) => {
  try {
    const products = readProductsFile(); // Read from products.json
    res.status(200).json(products);
  } catch (error) {
    console.error('Error retrieving products:', error);
    res.status(500).json({ error: 'An unexpected error occurred while retrieving products' });
  }
});



// Define a route to get the products
app.get('/api/products', (req, res) => {
  // Read the products.json file
  const productsFilePath = path.join(__dirname, 'data', 'products.json'); // Update the path if needed
  fs.readFile(productsFilePath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading products.json:', err);
      return res.status(500).send('Server error');
    }
    const products = JSON.parse(data);
    res.json(products); // Send the products as JSON
  });
});

app.get('/export-products', async (req, res) => {
  try {
    // Fetch all products from the database
    const products = await Product.find();
    
    // Define the file path where the JSON file will be saved
    const filePath = path.join(__dirname, 'products.json');
    
    // Convert the products data to a JSON string
    const jsonData = JSON.stringify(products, null, 2); // Pretty print with 2-space indentation
    
    // Write the data to products.json
    fs.writeFileSync(filePath, jsonData, 'utf-8');
    
    // Send a success response
    res.status(200).json({ message: 'Products exported successfully' });
  } catch (error) {
    console.error('Error exporting products:', error);
    res.status(500).json({ error: 'An unexpected error occurred while exporting products' });
  }
});

app.patch('/products/name/:name', async (req, res) => {
  const productName = req.params.name; // Get the product name from the URL
  const { stock } = req.body; // Get the new stock value from the request body

  // Validate the input
  if (stock === undefined || stock < 0) {
    console.error('Invalid stock value:', { stock });
    return res.status(400).json({ error: 'Invalid stock value.' });
  }

  try {
    // Find the product in the database by name
    const product = await Product.findOne({ name: productName });
    
    if (!product) {
      console.error('Product not found:', productName);
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Update the stock
    product.stock = stock;

    // Save the updated product
    await product.save();

    // Respond with the updated product
    console.log('Stock updated successfully:', product);
    return res.status(200).json({ message: 'Stock updated successfully!', product });
  } catch (error) {
    console.error('Error updating stock:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});



// Create User
app.post('/create', async (req, res) => {
    try {
      const { username, password, fullname, email, address, phone, question, answer } = req.body;
      const role = "user";
      console.log(req.body);
  
      if (!username || !password || !fullname || !email || !address || !phone || !question || !answer) {
        return res.status(400).send({ error: 'All fields are required' });
      }
  
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).send({ error: 'Username already exists' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ username, password: hashedPassword, fullname, email, address, phone,role,question,answer });
      await newUser.save();
  
      res.status(201).send({ message: 'User created successfully' });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).send({ error: 'An unexpected error occurred while creating the user' });
    }
  });
  app.post('/get-role', async (req, res) => {
    const { username } = req.body;
  
    try {
      // Fetch the user from the database
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.status(200).json({ role: user.role }); // Send the user's role back to the client
    } catch (error) {
      console.error('Error fetching user role:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

// Login User
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    usernamep = username;
    if (!username || !password) {
      return res.status(400).send({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({ error: 'Invalid credentials' });
    }

    res.send({ message: 'Login successful', user: { username: user.username } });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send({ error: 'An unexpected error occurred while logging in' });
  }
});

// Save Cart
app.post('/save-cart', async (req, res) => {
  try {
    const { usernamep, discountCode, cartItems, address, phone, bkash } = req.body; // Get the discount code, username, and cart items
    
    // Fetch all orders for the given username
    const allOrders = await Person.find({ [usernamep]: { $exists: true } })
      .select('order')  // Only select the 'order' field
      .exec();

    // Find the maximum order number
    let nextOrder = 1;  // Default to 1 if no previous orders

    if (allOrders.length > 0) {
      const orderNumbers = allOrders.map(order => parseInt(order.order, 10));  // Extract all the order numbers
      console.log("All orders:", orderNumbers);

      // Find the maximum order number
      const maxOrder = Math.max(...orderNumbers);

      if (!isNaN(maxOrder)) {
        nextOrder = maxOrder + 1;  // Increment by 1
      } else {
        console.error("Invalid order numbers found:", orderNumbers);
      }
    }

    console.log('Next Order:', nextOrder);  // Debug the next order number

    // Create a new Person document with the incremented order and include the discount code
    const person = new Person({ 
      order: nextOrder,  // Store order as a number
      [usernamep]: cartItems,  // Store cart items
      discountCode: discountCode,  // Save the discount code
      status: 'Active' ,
      address: address,
      phone: phone,
      bkashTCode: bkash
    });

    // Save the person's information to the database
    await person.save();

    // Now increment the discount code usage count
    const discount = await DiscountCode.findOne({ discountCode: discountCode });
    
    if (discount) {
      // Increment the usage count for the discount code
      discount.usageCount += 1;
      await discount.save();
      console.log(`Usage count for discount code ${discountCode} incremented.`);
    }

    res.status(201).json({ message: 'Cart saved and discount code usage updated successfully' });
  } catch (error) {
    console.error('Error saving cart:', error);
    res.status(400).json({ error: 'Error saving cart' });
  }
});




  
  
  
  
  
// Get All Items
app.get('/items', async (req, res) => {
    try {
      const items = await Person.find(); // Fetch all items from the database
      console.log(items); // Log the items to the console
      res.status(200).json(items); // Send the items as a response
    } catch (error) {
      console.error('Error retrieving items:', error);
      res.status(500).json({ error: 'An unexpected error occurred while retrieving items' });
    }
  });
  
  app.get('/items/:username', async (req, res) => {
    const { username } = req.params;
  
    try {
      // Find all documents with the username key
      const userDocuments = await Person.find({ [username]: { $exists: true } });
  
      if (!userDocuments || userDocuments.length === 0) {
        return res.status(404).json({ error: 'No items found for this user' });
      }
  
      // Collect all items under the username key
      const allItems = [];
      userDocuments.forEach((doc) => {
        if (doc[username]) {
          allItems.push(...doc[username]);
        }
      });
  
      res.status(200).json({ items: allItems });
    } catch (error) {
      console.error('Error retrieving items:', error);
      res.status(500).json({ error: 'An unexpected error occurred while retrieving items' });
    }
  });

// Update Status for a Specific User's Order
// Update Status for a Specific User's Order
app.put('/update-status/:username/:id', async (req, res) => {
    const { username, id } = req.params; // Username and Order ID
    const { status } = req.body; // New status

    // Validate status
    if (!status || !['Active', 'Complete', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid or missing status. Valid values are Active, Complete, and Cancelled.' });
    }

    try {
      // Find the document with the username and specific order ID, then update the status
      const updatedDocument = await Person.findOneAndUpdate(
        { _id: id, [username]: { $exists: true } },
        { $set: { status } },
        { new: true } // Return the updated document
      );

      if (!updatedDocument) {
        return res.status(404).json({ error: 'Order not found for this user' });
      }

      res.status(200).json(updatedDocument);
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
});

  
  
  

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
