# 🍱 AI Food Calories Meter

### Computer Vision-Based Food Recognition and Personalized Nutrition Tracking System

**AI Food Calories Meter** is an AI-powered web application that helps users track their food and nutrition without having to manually enter every meal.

The main idea behind this project is simple: **take a picture of your food, let AI identify it, and get an estimated calorie and nutrition breakdown.**

Users can upload a food image or use a live camera to detect food. Once the food is recognized, the system provides information such as calories, protein, carbohydrates, fats, and other nutritional values. The results can then be saved to the user's meal history and viewed through a personalized dashboard.

The project combines **Computer Vision, Deep Learning, React, Java Spring Boot, and MySQL** to create a complete end-to-end application.

---

## 🚀 What Can You Do With It?

### 📷 Recognize Food

Users can provide food through:

* Image upload
* Live camera

The AI model analyzes the image and predicts the food item along with a confidence score.

For example:

```text
Input:
🍛 Food Image

AI Prediction:
Chicken Biryani

Confidence:
94%
```

---

### 🔥 Track Calories

After identifying the food, the application provides an estimated nutritional breakdown.

For example:

| Nutrient      | Estimated Value |
| ------------- | --------------: |
| Calories      |        320 kcal |
| Protein       |            18 g |
| Carbohydrates |            42 g |
| Fat           |             9 g |

The nutritional information can then be added to the user's daily intake.

---

### 📊 Personal Nutrition Dashboard

The dashboard gives users a simple overview of what they have consumed during the day.

It can show:

* Total calories consumed
* Protein intake
* Carbohydrates
* Fat
* Meal history
* Daily nutrition goals
* Remaining calories

Instead of checking individual meals separately, users can get an overall picture of their daily nutrition from one place.

---

### 👤 User Profiles

Each user has their own account and nutrition data.

The system can maintain information such as:

* User profile
* Nutrition goals
* Food records
* Meal history
* Daily calorie intake

This allows the application to provide a more personalized experience.

---

### 🔐 Authentication

The application includes user authentication so that nutrition data is associated with the correct account.

The project is designed to support:

* User registration
* Login
* Secure authentication
* Google authentication
* User-specific data

---

# 🧠 How the AI Part Works

The basic food recognition process looks like this:

```text
Food Image / Camera
        ↓
Image Preprocessing
        ↓
AI / Computer Vision Model
        ↓
Food Recognition
        ↓
Food Name + Confidence
        ↓
Nutrition Information
        ↓
Calories & Macronutrients
        ↓
User Dashboard
```

The model takes the food image as input and predicts the most likely food category.

The prediction is then connected with nutritional information so that the application can estimate the calories and macronutrients associated with the food.

---

# 📷 Live Camera Detection

One of the important parts of the project is moving beyond simple image uploads.

The application is being designed to support **live camera-based food detection**.

The idea is:

```text
Camera
   ↓
Live Video Frames
   ↓
Frame Processing
   ↓
Food Detection
   ↓
Food Classification
   ↓
Nutrition Estimation
```

This makes the application more practical for everyday use because users don't always want to take a photo, save it, and upload it manually.

---

# 🏗️ Project Architecture

The application is divided into three major parts:

```text
                    USER
                      │
                      ▼
             ┌─────────────────┐
             │ React Frontend  │
             │                 │
             │ Dashboard       │
             │ Food Upload     │
             │ Live Camera     │
             │ Login/Register  │
             └────────┬────────┘
                      │
                   REST API
                      │
                      ▼
             ┌─────────────────┐
             │ Java Backend    │
             │ Spring Boot     │
             │                 │
             │ Authentication  │
             │ User Management │
             │ Food APIs       │
             └───────┬─────────┘
                     │
            ┌────────┴────────┐
            ▼                 ▼
      ┌───────────┐    ┌──────────────┐
      │   MySQL   │    │  AI / CV     │
      │ Database  │    │    Model     │
      └───────────┘    └──────────────┘
```

---

# 🛠️ Technologies Used

## Frontend

* React.js
* JavaScript
* HTML
* CSS
* Responsive UI
* Camera API
* REST API integration

## Backend

* Java
* Spring Boot
* REST APIs
* Spring Security

## Database

* MySQL

## AI / Machine Learning

* Python
* Machine Learning
* Deep Learning
* Computer Vision
* Image Classification

## Tools

* Git & GitHub
* VS Code
* IntelliJ IDEA
* MySQL Workbench
* Postman
* npm

---

# 📁 Project Structure

The project is organized into separate components for the frontend, backend, AI model, and database.

```text
AI-Food-Calories-Meter/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── assets/
│   │   └── App.jsx
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   └── test/
│   └── pom.xml
│
├── ai-model/
│   ├── dataset/
│   ├── notebooks/
│   ├── models/
│   └── training/
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
└── README.md
```

---

# ⚙️ Running the Project

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/AI-Food-Calories-Meter.git

cd AI-Food-Calories-Meter
```

---

## 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend normally runs on:

```text
http://localhost:5173
```

---

## 3. Start the Backend

Open another terminal:

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

The backend normally runs on:

```text
http://localhost:8080
```

---

## 4. Configure MySQL

Create the database:

```sql
CREATE DATABASE ai_food_calories;
```

Then configure the MySQL credentials in the Spring Boot configuration file.

Example:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ai_food_calories
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD

spring.jpa.hibernate.ddl-auto=update
```

Replace `YOUR_PASSWORD` with your local MySQL password.

---

# 📡 Example API

A food analysis request can look something like:

```text
POST /api/food/analyze
```

The request contains the food image.

Example response:

```json
{
  "foodName": "Chicken Biryani",
  "confidence": 0.94,
  "calories": 320,
  "protein": 18,
  "carbohydrates": 42,
  "fat": 9
}
```

The frontend can use this information to display the result and allow the user to add it to their meal history.

---

# 🎯 Why We Built This

Tracking calories manually can become repetitive.

A person may have to:

1. Identify the food.
2. Search for it in a nutrition app.
3. Enter the quantity.
4. Check the calories.
5. Record the meal.
6. Repeat the process for every meal.

We wanted to reduce this manual work by using **Computer Vision and AI**.

The goal is not to completely replace nutrition professionals or provide medically accurate dietary advice. Instead, the application is intended to make **everyday food tracking faster and easier**.

---

# 🌱 Future Improvements

There are several features we would like to add as the project develops.

### 🤖 Better Food Detection

* More food categories
* Improved model accuracy
* Multiple food items in one image
* Real-time object detection

### ⚖️ Portion Estimation

One of the biggest challenges in calorie estimation is determining how much food is actually present.

Future versions could use Computer Vision to estimate:

* Portion size
* Food quantity
* Approximate weight

This would make calorie estimation more useful than simply assigning a fixed value to a food item.

### 🥗 Personalized Recommendations

The system could eventually recommend meals based on:

* Daily calorie goals
* Protein requirements
* Previous meals
* Nutrition preferences
* Remaining daily macros

### 📈 Nutrition Analytics

Future versions could include:

* Weekly reports
* Monthly reports
* Nutrition trends
* Goal tracking
* Progress charts

### 📱 Mobile Application

The web application can eventually be extended into a mobile application so users can track meals directly from their phones.

---

# 🔬 Project Highlights

This project brings together several areas of software development and Artificial Intelligence:

```text
                 AI FOOD CALORIES METER
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   Computer Vision    Full-Stack Dev    Data Management
        │                 │                 │
   Deep Learning      React + Java       MySQL
        │             Spring Boot
   Food Recognition       │
        │              REST APIs
        │
   Nutrition Analysis
```

The main focus is building an **end-to-end AI application**, from taking an image as input to presenting useful nutrition information to the user.

---

# 👨‍💻 Team

Developed as an academic and portfolio project focused on **Artificial Intelligence, Computer Vision, and Full-Stack Development**.

---

# 📜 License

This project is intended for educational, research, and demonstration purposes.

---

## ⭐ Project Vision

We want to make food tracking less complicated.

Instead of manually entering every meal, the long-term vision of **AI Food Calories Meter** is:

> **Take a picture. Let AI understand the food. Track your nutrition.**

---

⭐ If you find this project interesting, consider giving the repository a star!
