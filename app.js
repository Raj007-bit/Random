//jshint esversion:6
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const https = require("https");
const qs = require("querystring");

const {
  wrap
} = require("lodash");
var striptags = require('striptags');
var cookieParser = require('cookie-parser')
var flash = require("connect-flash");
var nodemailer = require('nodemailer');
const app = express();
const parseUrl = express.urlencoded({
  extended: false
});
const parseJson = express.json({
  extended: false
});
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  limit: '3mb',
  extended: true
}));
app.use(bodyParser.json({
  limit: '3mb'
}));
app.use(express.static("public"));
app.use(express.static(`${__dirname}/public`));
app.use(express.static(__dirname + "/Upload"));
app.use(session({
  secret: "Random",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(flash());

const imageMimeTypes = ["image/jpeg", "image/png", "image/png"];

mongoose.set('useCreateIndex', true);




/*--------------Painting Schema------------*/
const movieSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  length: {
    type: String,
    required: true
  },
  width: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  subcategory: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  price: {
    type: String,
    default: false
  },
  img: {
    type: Buffer,
    required: true
  },
  imgType: {
    type: String,
    required: true
  },
  img1: {
    type: Buffer,
    required: true
  },
  imgType1: {
    type: String,
    required: true
  },
  img2: {
    type: Buffer,
    required: true
  },
  imgType2: {
    type: String,
    required: true
  },

});

/*--------------First Image Virtual Funaction------------*/
movieSchema.virtual('coverImagePath').get(function() {
  if (this.img != null && this.imgType != null) {
    return `data:${this.imgType};charset=utf-8;base64,${this.img.toString('base64')}`;
  }
});
/*--------------Second Image Virtual Funaction------------*/
movieSchema.virtual('coverImagePath1').get(function() {
  if (this.img1 != null && this.imgType1 != null) {
    return `data:${this.imgType1};charset=utf-8;base64,${this.img1.toString('base64')}`;
  }
});
/*--------------Third Image Virtual Funaction------------*/
movieSchema.virtual('coverImagePath2').get(function() {
  if (this.img2 != null && this.imgType2 != null) {
    return `data:${this.imgType2};charset=utf-8;base64,${this.img2.toString('base64')}`;
  }
});
const Movie = mongoose.model("Movie", movieSchema);





/*--------------Video Schema------------*/
const videoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  }

});
const Video = mongoose.model("Video", videoSchema);

/*--------------Video Schema------------*/
const notificationSchema = new mongoose.Schema({
  message: String,
  link:{
      type:String,
      default:"none"
  },
});
const Notification = mongoose.model("Notification", notificationSchema);

/*--------------Multer Function------------*/
var multer = require("multer");
var storage = multer.diskStorage({
  destination: "./public/Upload/",
  filename: function(req, file, callback) {
    callback(null, file.fieldname + "_" + Date.now() + file.originalname);
  },
});
var upload = multer({
  storage: storage
}).single('Image');


/*--------------Passport Google Authentication ------------*/
/*--------------User Schema------------*/
const userSchema = new mongoose.Schema({
  username: String,
  firstname: String,
  lastname: String,
  password: String,
  googleId: String,
  secret: String,
  admin: {
    type: String,
    default: false
  }
});
userSchema.plugin(passportLocalMongose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://sleepy-temple-98535.herokuapp.com/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));



/*--------------MongoDb Connection ------------*/
mongoose.connect("mongodb+srv://Rajendra:Raj1234@cluster0.jz94f.mongodb.net/randomDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});



app.get("/", function(req, res) {
  res.render("index");
});

app.get("/notifications", function(req, res) {
  Notification.find({}, function (err, not) {
  res.render("notification",{not:not});
  })
});

app.get("/createnotification", function(req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.params.id, function(err, foundUser) {
      Notification.find({school: req.user.school}, function(err, not){
      var name = req.user.firstname;
      if (req.user.admin == 'true') {
        res.render("createnotification", {
          user: foundUser,
          name: name,
          not:not
        });
      } else {
        res.render("login", {
          user: foundUser,
          name: name
        });
      }
    });
  });
  } else {
    res.redirect("/login");
  }
});

app.get("/term_of_use", function(req, res) {
  res.render("term_of_use");
});

app.get("/privacy_policy", function(req, res) {
  res.render("privacy_policy");
});

app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile"]
  }));

app.get("/auth/google/secrets",
  passport.authenticate("google", {
    failureRedirect: "/login"
  }),
  function(req, res) {
    if (req.user.admin == true) {
      res.redirect("/admin");
    } else {
      res.redirect("/dashboard");
    }
  });


app.get("/contact", function(req, res) {
  res.render("contact");
});

app.get("/admin", function(req, res) {
  res.render("admin");
});

app.get("/home", function(req, res) {
  res.render("home");
});

app.get("/gallery", async (req, res, next) => {
  try {
    const movie = await Movie.find();
    res.render("gallery", {
      movie
    });
  } catch (err) {
    console.log("err: " + err);
  }
});

app.get("/movie/:movieId", async (req, res) => {

  const requestedMovieId = req.params.movieId;
  const movie = await Movie.find();
  Movie.findOne({
    _id: requestedMovieId
  }, function(err, movie) {
    res.render("movie", {
      movie
    });
  });

});


app.get("/fullview/:movieId", async (req, res) => {

  const requestedMovieId = req.params.movieId;
  const movie = await Movie.find();
  Movie.findOne({
    _id: requestedMovieId
  }, function(err, movie) {
    res.render("fullview", {
      movie
    });
  });
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/videos", function(req, res) {
  Video.find({}, function(err, videos) {
    Video.find({
      category: 'Tutorial'
    }, function(err, tutorial) {
      Video.find({
        category: 'Painting'
      }, function(err, painting) {
        Video.find({
          category: 'Sketch'
        }, function(err, sketch) {
          Video.find({
            category: 'Portrait'
          }, function(err, portrait) {
            res.render("videos", {
              videos: videos,
              painting: painting,
              tutorial: tutorial,
              sketch: sketch,
              portrait: portrait
            });
          });
        });
      });
    });
  });
});

app.get("/uploadvideo", function(req, res) {
  res.render("uploadvideo");
});

app.get("/register", function(req, res) {
  res.render("register");
});


app.get("/regi", function(req, res) {
  res.render("regi");
});

app.get("/dashboard", function(req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.params.id, function(err, foundUser) {
      var name = req.user.firstname;
      if (req.user.admin == 'true') {
        res.render("admin", {
          user: foundUser,
          name: name
        });
      } else {
        res.render("dashboard", {
          user: foundUser,
          name: name
        });
      }
    });
  } else {
    res.redirect("/login");
  }
});



/*-----------------Painting Routes--------------------*/
app.get("/digitalpainting", async (req, res, next) => {
  try {
    const movie = await Movie.find();
    Movie.find({
      category: 'digitalpainting',
      subcategory: 'portrait'
    }, function(err, raju) {
      Movie.find({
        category: 'digitalpainting',
        subcategory: 'kaju'
      }, function(err, kaju) {
        Movie.find({
          category: 'digitalpainting',
          subcategory: 'ashu'
        }, function(err, ashu) {
          Movie.find({
            category: 'digitalpainting',
            subcategory: 'apar'
          }, function(err, apar) {
            res.render("digitalpainting", {
              raju: raju,
              kaju: kaju,
              ashu: ashu,
              apar: apar,
              movie
            });
          });
        });
      });
    });
  } catch (err) {
    console.log("err: " + err);
  }
});

app.get("/acrylicpainting", async (req, res, next) => {
  try {
    const movie = await Movie.find();
    Movie.find({
      category: 'acrylicpainting',
      subcategory: 'none'
    }, function(err, acrylic) {
      res.render("acrylicpainting", {
        acrylic: acrylic,
        movie
      });
    });
  } catch (err) {
    console.log("err: " + err);
  }
});

app.get("/oilpainting", async (req, res, next) => {
  try {
    const movie = await Movie.find();
    Movie.find({
      category: 'oilpainting',
      subcategory: 'none'
    }, function(err, oilpainting) {
      res.render("oilpainting", {
        oilpainting: oilpainting,
        movie
      });
    });
  } catch (err) {
    console.log("err: " + err);
  }
});


app.get("/pencilsketch", async (req, res, next) => {
  try {
    const movie = await Movie.find();
    Movie.find({
      category: 'pencilsketch',
      subcategory: 'landscape'
    }, function(err, landscape) {
      Movie.find({
        category: 'pencilsketch',
        subcategory: 'portrait'
      }, function(err, portrait) {

        res.render("pencilsketch", {
          landscape: landscape,
          portrait: portrait,
          movie
        });
      });
    });
  } catch (err) {
    console.log("err: " + err);
  }
});

app.get("/tribalart", async (req, res, next) => {
  try {
    const movie = await Movie.find();
    Movie.find({
      category: 'tribalart',
      subcategory: 'none'
    }, function(err, tribalart) {
      res.render("tribalart", {
        tribalart: tribalart,
        movie
      });
    });
  } catch (err) {
    console.log("err: " + err);
  }
});


app.post("/register", function(req, res) {
  User.register({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        req.flash("success", "Email received, we will contact you shortly!");
        res.redirect("/regi");
      });
    }
  });

});

app.post("/login", passport.authenticate("local", {
  successFlash: "logged in!",
  successRedirect: "/dashboard",
  failureFlash: "Invalid username or password.",
  failureRedirect: "/login",
}), );

app.get("/profile", function(req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.params.id, function(err, foundUser) {
      var name = req.user.firstname;
      var surname = req.user.lastname;
      var username = req.user.username;

      if (err) {
        console.log(err);
      } else {
        res.render("profile", {
          user: foundUser,
          name: name,
          username: username,
          surname: surname
        });
      }
    });
  } else {
    res.redirect("/dashboard");
  }
});

app.post('/uploadvideo', (req, res) => {
  const video = new Video({
    url: req.body.url,
    category: req.body.category
  });

  video.save(function(err) {
    if (!err) {
      res.redirect("/videos");
    }
  });
});

app.post('/notification', (req, res) => {
  const notification = new Notification({
    message: req.body.message,
    link: req.body.link
  });
  notification.save(function(err) {
    if (!err) {
      res.redirect("/createnotification");
    }
  });
});


app.get("/logout", function(req, res) {
  req.logout();
  res.redirect('/');
});


/*-------------------Upload Image----------------------*/
app.get("/upload", async (req, res, next) => {
  try {
    const movie = await Movie.find();
    res.render("upload", {
      movie
    });
  } catch (err) {
    console.log("err: " + err);
  }
});

app.post('/add', async (req, res, next) => {
  const {
    name,
    width,
    length,
    category,
    subcategory,
    description,
    date,
    price,
    img,
    img1,
    img2
  } = req.body;
  const movie = new Movie({
    name,
    width,
    length,
    category,
    subcategory,
    description,
    date,
    price
  });

  // SETTING IMAGE AND IMAGE TYPES
  saveImage(movie, img);
  try {
    const newMovie = await movie.save();

    res.redirect('/home');
  } catch (err) {
    console.log(err);
  }
  saveImage1(movie, img1);
  try {
    const newMovie = await movie.save();
    res.redirect('/home');
  } catch (err) {
    console.log(err);
  }
  saveImage2(movie, img2);
  try {
    const newMovie = await movie.save();
    res.redirect('/home');
  } catch (err) {
    console.log(err);
  }
});

function saveImage(movie, imgEncoded) {
  // CHECKING FOR IMAGE IS ALREADY ENCODED OR NOT
  if (imgEncoded == null) return;

  // ENCODING IMAGE BY JSON PARSE
  // The JSON.parse() method parses a JSON string, constructing the JavaScript value or object described by the string
  const img = JSON.parse(imgEncoded);
  console.log("JSON parse: " + img);

  // CHECKING FOR JSON ENCODED IMAGE NOT NULL
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
  // AND HAVE VALID IMAGE TYPES WITH IMAGE MIME TYPES
  if (img != null && imageMimeTypes.includes(img.type)) {

    // https://nodejs.org/api/buffer.html
    // The Buffer class in Node.js is designed to handle raw binary data.
    // SETTING IMAGE AS BINARY DATA
    movie.img = new Buffer.from(img.data, "base64");
    movie.imgType = img.type;
  }
}

function saveImage1(movie, imgEncoded) {
  // CHECKING FOR IMAGE IS ALREADY ENCODED OR NOT
  if (imgEncoded == null) return;

  // ENCODING IMAGE BY JSON PARSE
  // The JSON.parse() method parses a JSON string, constructing the JavaScript value or object described by the string
  const img1 = JSON.parse(imgEncoded);
  console.log("JSON parse: " + img1);

  // CHECKING FOR JSON ENCODED IMAGE NOT NULL
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
  // AND HAVE VALID IMAGE TYPES WITH IMAGE MIME TYPES
  if (img1 != null && imageMimeTypes.includes(img1.type)) {

    // https://nodejs.org/api/buffer.html
    // The Buffer class in Node.js is designed to handle raw binary data.
    // SETTING IMAGE AS BINARY DATA
    movie.img1 = new Buffer.from(img1.data, "base64");
    movie.imgType1 = img1.type;
  }
}

function saveImage2(movie, imgEncoded) {
  // CHECKING FOR IMAGE IS ALREADY ENCODED OR NOT
  if (imgEncoded == null) return;

  // ENCODING IMAGE BY JSON PARSE
  // The JSON.parse() method parses a JSON string, constructing the JavaScript value or object described by the string
  const img2 = JSON.parse(imgEncoded);
  console.log("JSON parse: " + img2);

  // CHECKING FOR JSON ENCODED IMAGE NOT NULL
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
  // AND HAVE VALID IMAGE TYPES WITH IMAGE MIME TYPES
  if (img2 != null && imageMimeTypes.includes(img2.type)) {

    // https://nodejs.org/api/buffer.html
    // The Buffer class in Node.js is designed to handle raw binary data.
    // SETTING IMAGE AS BINARY DATA
    movie.img2 = new Buffer.from(img2.data, "base64");
    movie.imgType2 = img2.type;
  }
}


/*-------------------Contact Send Emails-------------------------*/
app.post("/send", function(req, res) {
  mail = req.body.email;
  subject = req.body.subject;
  msg = req.body.message;
  hero = req.body.Name;
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ashuart.random@gmail.com',
      pass: 'Minitapatel@182'
    }
  });

  var mailOptions = {
    from: 'ashuart.random@gmail.com',
    to: mail,
    subject: 'Random Art',
    html: `<h1>Thank You</h1>
           Your Message is received by our Team<br>
           <br>
           <h3>:)</h3>
           `
  };

  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
      res.redirect('contact');

    }
  });

  var mailOptions1 = {
    from: mail,
    to: 'ashuart.random@gmail.com',
    subject: subject,
    html: msg,
  };


  transporter.sendMail(mailOptions1, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);

    }
  });
});


/*------------------Admin Routes------------------------*/
app.get("/deletevideo", function(req, res) {
  if (req.isAuthenticated()) {
    Video.find({}, function(err, videos) {
      Video.find({
        category: 'Tutorial'
      }, function(err, tutorial) {
        Video.find({
          category: 'Painting'
        }, function(err, painting) {
          Video.find({
            category: 'Sketch'
          }, function(err, sketch) {
            Video.find({
              category: 'Portrait'
            }, function(err, portrait) {
              res.render("deletevideo", {
                videos: videos,
                painting: painting,
                tutorial: tutorial,
                sketch: sketch,
                portrait: portrait
              });
            });
          });
        });
      });
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/editimage", async (req, res, next) => {
  if (req.isAuthenticated()) {
    try {
      const movie = await Movie.find();
      res.render("editimage", {
        movie
      });
    } catch (err) {
      console.log("err: " + err);
    }
  } else {
    res.redirect("/login");
  }
});


/*------------------Edit Routes------------------------*/
app.get("/edit/:id", async (req, res, next) => {
  if (req.isAuthenticated()) {
    Movie.findById(req.params.id, function(err, foundMovie) {
      if (err) {
        console.log(err);
      } else {
        res.render("edit", {
          movie: foundMovie
        });
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/updatepainting/:id", function(req, res) {

  var id = req.params.id;
  var movie = req.body.movie;
  Movie.updateMany({
      _id: id
    }, {
      $set: {
        name: movie.name,
        description: movie.description,
        width: movie.width,
        length: movie.length,
        price: movie.price,
        date: movie.date,
        category: movie.category,
        subcategory: movie.subcategory,
      },
    },
    function(err, data) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/editimage");
      }
    }
  );
});


/*------------------Delete Routes------------------------*/
app.post("/delete/:id", function(req, res) {
  Video.findByIdAndRemove(req.params.id, function(err, not) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/deletevideo");
    }
  });
});

app.post("/delete/:id", function(req, res) {
  Movie.findByIdAndRemove(req.params.id, function(err, not) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/editimage");
    }
  });
});

app.post("/not/:id", function(req, res) {
  Notification.findByIdAndRemove(req.params.id, function(err, not) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/createnotification");
    }
  });
});


/*------------------Port Listen------------------------*/
app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
