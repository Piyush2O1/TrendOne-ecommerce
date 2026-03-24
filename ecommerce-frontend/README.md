# E-Commerce Frontend

A modern React frontend for an e-commerce application built with TypeScript, Vite, and integrated with a Node.js backend.

## Features

- 🔐 **Authentication**: Login and signup with JWT tokens
- 🛍️ **Product Catalog**: Browse products with search and filtering
- 🛒 **Shopping Cart**: Add/remove items, persistent cart state
- 💳 **Secure Checkout**: Integrated Razorpay payment gateway
- 📦 **Order Management**: View order history and status
- 📱 **Responsive Design**: Mobile-friendly UI

## Tech Stack

- **React 18** with TypeScript
- **React Router** for navigation
- **Axios** for API calls
- **Context API** for state management
- **CSS Modules** for styling
- **Vite** for build tooling

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Running backend server on `http://localhost:5000`

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.tsx      # Navigation bar
│   └── Navbar.css
├── context/            # React Context for state management
│   ├── AuthContext.tsx # Authentication state
│   └── CartContext.tsx # Shopping cart state
├── pages/              # Page components
│   ├── Home.tsx        # Landing page
│   ├── Login.tsx       # Login page
│   ├── Signup.tsx      # Registration page
│   ├── Products.tsx    # Product catalog
│   ├── Cart.tsx        # Shopping cart
│   ├── Checkout.tsx    # Payment checkout
│   ├── Orders.tsx      # Order history
│   └── *.css           # Page styles
├── App.tsx             # Main app component with routing
├── App.css             # Global styles
├── main.tsx            # App entry point
└── index.css           # Base styles
```

## API Integration

The frontend connects to a Node.js backend with the following endpoints:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `DELETE /api/cart/:productId` - Remove item from cart

### Orders
- `POST /api/orders` - Place order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details

### Payments
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment

## Environment Setup

Create a `.env` file in the backend directory with:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ecommerce
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

## Usage

1. **Register/Login**: Create an account or login to access features
2. **Browse Products**: View available products on the products page
3. **Add to Cart**: Click "Add to Cart" on products
4. **Checkout**: Review cart and proceed to payment
5. **Payment**: Complete payment using Razorpay
6. **Orders**: View order history and status

## Features in Detail

### Authentication
- JWT-based authentication
- Protected routes for logged-in users
- Admin role support for product management

### Shopping Cart
- Persistent cart using local storage and API
- Real-time cart updates
- Quantity management

### Payment Integration
- Razorpay payment gateway
- Secure payment verification
- Order status tracking

### Responsive Design
- Mobile-first approach
- Clean, modern UI
- Intuitive navigation

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.