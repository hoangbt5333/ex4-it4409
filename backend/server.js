const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve the frontend (static) so visiting http://localhost:<PORT>/ shows the UI
app.use(express.static(path.join(__dirname, '..', 'public')));

mongoose
.connect(process.env.MONGO_URI)
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("MongoDB Error:", err));

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, "Ten khong duoc de trong"],
        minlength: [2, "Ten phai co it nhat 2 ky tu"],
    },
    age:{
        type: Number,
        required: [true, "Tuoi khong duoc de trong"],
        min: [0, "Tuoi phai lon hon hoac bang 0"],
        validate: {
            validator: Number.isInteger,
            message: "Tuoi phai la so nguyen"
        }
    },
    email:{
        type: String,
        required: [true, "Email khong duoc de trong"],
        match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
        unique: true,
        lowercase: true,
        trim: true
    },
    address:{
        type: String
    }
});

const User = mongoose.model("User", userSchema);


app.get("/api/users", async (req, res) => { 
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const search = req.query.search || "";
        

        const filter = search ? { 
            $or: [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { address: { $regex: search, $options: "i" } }
            ] 
        } : {};

        const skip = (page - 1) * limit;

        const users = await User.find(filter).skip(skip).limit(limit);

        const total = await User.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        res.json({
            page,
            limit,
            total,
            totalPages,
            data: users
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/users", async (req, res) => { 
    try {
        const { name, age, email, address } = req.body;

        const newUser = await User.create({ name, age, email, address });
        res.status(201).json({
        message: "Tạo người dùng thành công",
        data: newUser
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: "Email đã tồn tại" });
        }
        res.status(400).json({ error: err.message });
    }
 });

app.put("/api/users/:id", async (req, res) => { 
    try {
    const { id } = req.params;
    const { name, age, email, address } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
    id,
    { name, age, email, address },
    { new: true, runValidators: true } 
    );
    if (!updatedUser) {
    return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
    res.json({
    message: "Cập nhật người dùng thành công",
    data: updatedUser
    });
    } catch (err) {
    res.status(400).json({ error: err.message });
    }
 });

app.delete("/api/users/:id", async (req, res) => { 
    try {
        const { id } = req.params;

        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ error: "Không tìm thấy người dùng" });
        }
        res.json({
            message: "Xóa người dùng thành công"
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
 });






const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
