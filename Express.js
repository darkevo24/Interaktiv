const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User, Project, Task } = require('./models');

// Create Express app
const app = express();

// Configure middleware
app.use(express.json());

// Define authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, 'secret');
    const user = await User.findById(decoded.userId);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Define error handling middleware
const errorHandler = (error, req, res, next) => {
  res.status(500).json({ message: error.message });
};

// Define routes for authentication
app.post('/login',authenticate, async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      throw new Error('User not found');
    }
    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Incorrect password');
    }
    const token = jwt.sign({ userId: user._id }, 'secret');
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

app.post('/register',authenticate, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.json({ message: 'User created' });
  } catch (error) {
    next(error);
  }
});
// Define routes for user endpoints
app.post('/users',authenticate, (req, res) => {
  // Create a new user in the database
  const { name, email, password } = req.body;
  const user = new User({ name, email, password });
  user.save((err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error creating user');
    } else {
      res.status(201).send(user);
    }
  });
});

app.get('/users',authenticate, (req, res) => {
  // Get all users from the database
  User.find({}, (err, users) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(users);
    }
  });
});

app.get('/users/:id',authenticate, (req, res) => {
  // Get a user by ID from the database
  const { id } = req.params;
  User.findById(id, (err, user) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error finding user');
    } else if (!user) {
      res.status(404).send('User not found');
    } else {
      res.send(user);
    }
  });
});

app.put('/users/:id',authenticate,async (req, res) => {
  // Update a user by ID in the database
  const userId = req.params.id;
  const userData = req.body;

  try {
    const user = await User.findByIdAndUpdate(userId, userData, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/users/:id',authenticate, (req, res) => {
  // Delete a user by ID from the database
  const userId = req.params.id;
  User.findByIdAndDelete(userId)
    .then(() => {
      res.send(`User with ID ${userId} deleted successfully`);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error deleting user');
    });
});

// Define routes for project endpoints
app.post('/projects',authenticate, (req, res) => {
  // Create a new project in the database
  const { name, description, due_date, user_id } = req.body;
  Project.create({ name, description, due_date, user_id }, (err, project) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error creating project');
    } else {
      res.status(201).json(project);
    }
  });
});

app.get('/projects',authenticate, (req, res) => {
  // Get all projects from the database
  Project.find({}, (err, projects) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error retrieving projects from database');
    }
    res.send(projects);
  });
});

app.get('/projects/:id',authenticate, (req, res) => {
  // Get a project by ID from the database
  const projectId = req.params.id;
  Project.findById(projectId, (err, project) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  });
});

app.put('/projects/:id',authenticate, (req, res) => {
  // Update a project by ID in the database
  const projectId = req.params.id;
  const projectUpdates = req.body;

  Project.updateOne({_id: projectId}, projectUpdates, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error updating project');
    } else {
      res.send(result);
    }
  });
});

app.delete('/projects/:id',authenticate, (req, res) => {
  // Delete a project by ID from the database
  Project.findByIdAndDelete(req.params.id, (err, project) => {
    if (err) {
      console.log(err);
      return res.status(500).send(err);
    }
    if (!project) {
      return res.status(404).send('Project not found');
    }
    return res.send('Project deleted successfully');
  });
});

// Define routes for task endpoints
app.post('/tasks',authenticate, (req, res) => {
  // Create a new task in the database
  const { name, description, due_date, user_id, project_id } = req.body;

  Task.create({ name, description, due_date, user_id, project_id })
    .then(task => res.status(201).json(task))
    .catch(err => res.status(500).json({ error: err.message }));
});

app.get('/tasks',authenticate, (req, res) => {
  // Get all tasks from the database
  Task.find({}, (err, tasks) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).json(tasks);
    }
  });
});

app.get('/tasks/:id',authenticate, (req, res) => {
  // Get a task by ID from the database
  Task.findById(req.params.id)
  .populate('user_id', 'name email') // populate user data
  .populate('project_id', 'name description due_date') // populate project data
  .then(task => {
    if (!task) {
      return res.status(404).send('Task not found');
    }
    res.send(task);
  })
  .catch(err => {
    console.error(err);
    res.status(500).send('Internal server error');
  });
});

app.put('/tasks/:id',authenticate, (req, res) => {
  // Update a task by ID in the database
  const taskId = req.params.id;
  const updatedTask = req.body;
  Task.findByIdAndUpdate(taskId, updatedTask, { new: true })
    .then(task => {
      if (!task) {
        return res.status(404).send({
          message: `Task with id ${taskId} not found.`
        });
      }
      res.send(task);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || `Error updating task with id ${taskId}.`
      });
    });
});

app.delete('/tasks/:id',authenticate, async(req, res) => {
  // Delete a task by ID from the database
  try {
    const taskId = req.params.id;
    
    // Delete the task from the database
    const deletedTask = await Task.findByIdAndDelete(taskId);

    // If task was deleted, return success message
    if (deletedTask) {
      res.status(200).json({ message: `Task with ID ${taskId} was deleted successfully` });
    } else {
      // If task was not found, return error message
      res.status(404).json({ error: `Task with ID ${taskId} was not found` });
    }
  } catch (error) {
    // If an error occurred, return error message
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
