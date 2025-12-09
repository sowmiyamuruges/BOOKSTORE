const Seller = require('../models/Seller/SellerSchema');
const Book = require("../models/Seller/BookSchema");
const MyOrders = require('../models/Users/MyOrders');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

const SellerLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const seller = await Seller.findOne({ email });

    if (!seller) return res.status(404).json({ message: 'No user found' });

    if (seller.password !== password)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(seller._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      Status: 'Success',
      user: { id: seller._id, name: seller.name, email: seller.email },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed' });
  }
}

const SellerRegister = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exists = await Seller.findOne({ email });

    if (exists) return res.status(400).json({ message: 'Already have an account' });

    const newSeller = await Seller.create({ name, email, password });
    const token = generateToken(newSeller._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      msg: "Account Created",
      user: { id: newSeller._id, name: newSeller.name, email: newSeller.email },
      token
    });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed' });
  }
}


const AddBook = async (req, res) => {
  const { title, author, genre, description, price, sellerId, sellerName } = req.body;
  const itemImage = req.file?.path;

  if (!title || !author || !genre || !price || !sellerId || !itemImage) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const item = new Book({
      title,
      author,
      genre,
      description,
      price,
      itemImage,
      sellerId,
      sellerName,
    });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create item' });
  }
};

const getBooks = async (req, res) => {
  const { userId } = req.params;
  try {
    const tasks = await Book.find({ sellerId: userId }).sort('position');
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};


const deleteBooks = async (req, res) => {
  const { id } = req.params;
  try {
    await Book.findByIdAndDelete(id);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

const getSellerOrders = async (req, res) => {
  try {
    const tasks = await MyOrders.find({ sellerId: req.params.userId }).sort('position');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}


module.exports = {
  SellerLogin,
  SellerRegister,
  AddBook,
  getBooks,
  deleteBooks,
  getSellerOrders
}