import './style.css';
import Timmy from './src/Timmy';

// Function to get the width and height based on the device size
const getDeviceDimensions = () => {
    const isSmallDevice = window.innerWidth < 800; // Check if the device width is less than 800
    const width = isSmallDevice ? window.innerWidth : 800; // Set width to window width if small device
    let height = width / 4 * 3; // Maintain a 2:1 aspect ratio
    height = height < 400 ? 400 : height;
    return { width, height };
};

const { width, height } = getDeviceDimensions(); // Get the dimensions based on device size

const timmy = new Timmy(width, height);
timmy.init();