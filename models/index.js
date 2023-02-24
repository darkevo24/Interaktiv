const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
mongoose.connect('mongodb+srv://darkevo24:Alvinyoyo9598@cluster0.jj06vef.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to MongoDB database');
});

// Define the user schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

// Define the project schema
const projectSchema = new mongoose.Schema({
  name: String,
  description: String,
  due_date: Date,
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Define the task schema
const taskSchema = new mongoose.Schema({
  name: String,
  description: String,
  due_date: Date,
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }
});

// Define the models for each schema
const User = mongoose.model('User', userSchema);
const Project = mongoose.model('Project', projectSchema);
const Task = mongoose.model('Task', taskSchema);

module.exports = {
  User,Project,Task
}