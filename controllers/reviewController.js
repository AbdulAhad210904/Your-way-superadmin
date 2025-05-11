import Review from '../models/Review.js';
import User from '../models/User.js';

export const createReview = async (req, res) => {
  const { userId, rating, comment } = req.body;

  try {
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found. Cannot create review.' });
    }

    const newReview = new Review({ userId, rating, comment });
    await newReview.save();

    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ message: 'Error creating review', error: error.message });
  }
};

export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find().populate('userId', 'name email'); // to show user details as well
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

export const getReviewByReviewId = async (req, res) => {
  const { id } = req.params;

  try {
    const review = await Review.findById(id).populate('userId', 'name email');
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.status(200).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching review', error: error.message });
  }
};

export const getReviewByUserId = async (req, res) => {
    const { userId } = req.params;
  
    try {
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      const reviews = await Review.find({ userId }).populate('userId', 'name email');
      if (reviews.length === 0) return res.status(404).json({ message: 'No reviews found for this user.' });
  
      res.status(200).json(reviews);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching reviews by user ID', error: error.message });
    }
};

export const updateReview = async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  try {
    const updatedReview = await Review.findByIdAndUpdate(
      id,
      { rating, comment },
      { new: true, runValidators: true }
    );
    if (!updatedReview) return res.status(404).json({ message: 'Review not found' });
    res.status(200).json({ message: 'Review updated successfully', updatedReview });
  } catch (error) {
    res.status(500).json({ message: 'Error updating review', error: error.message });
  }
};

export const updateReviewByUserId = async (req, res) => {
    const { userId } = req.params;
    const { rating, comment } = req.body;
    try{
        const userExists = await User.findById(userId);
        if (!userExists) {
          return res.status(404).json({ message: 'User not found. Cannot update review.' });
        }
        const updatedReview = await Review.findOneAndUpdate(
          { userId },
          { rating, comment },
          { new: true, runValidators: true }
        );
        if (!updatedReview) return res.status(404).json({ message: 'Review not found' });
        res.status(200).json({message: 'Review updated successfully', updatedReview});
       } catch (error) {
        res.status(500).json({ message: 'Error updating review', error: error.message });
       }
};

export const deleteReview = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedReview = await Review.findByIdAndDelete(id);
    if (!deletedReview) return res.status(404).json({ message: 'Review not found' });
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};
