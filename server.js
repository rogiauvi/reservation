const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const dataPath = path.join(__dirname, 'data', 'reservations.json');

// Ensure data directory and file exist
async function initializeDataFile() {
    try {
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
        try {
            await fs.access(dataPath);
        } catch {
            await fs.writeFile(dataPath, JSON.stringify([]));
        }
    } catch (error) {
        console.error('Error initializing data file:', error);
    }
}

// Get all reservations
app.get('/api/reservations', async (req, res) => {
    try {
        const data = await fs.readFile(dataPath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Error reading reservations' });
    }
});

// Add new reservation
app.post('/api/reservations', async (req, res) => {
    try {
        const { name, message, attendance } = req.body;
        
        if (!name || !attendance) {
            return res.status(400).json({ error: 'Name and attendance are required' });
        }

        const newReservation = {
            name,
            message: message || '',
            attendance,
            timestamp: new Date().toISOString()
        };

        const data = await fs.readFile(dataPath, 'utf8');
        const reservations = JSON.parse(data);
        reservations.push(newReservation);
        
        await fs.writeFile(dataPath, JSON.stringify(reservations, null, 2));
        res.status(201).json(newReservation);
    } catch (error) {
        res.status(500).json({ error: 'Error saving reservation' });
    }
});

// Get reservation statistics
app.get('/api/reservations/stats', async (req, res) => {
    try {
        const data = await fs.readFile(dataPath, 'utf8');
        const reservations = JSON.parse(data);
        
        const stats = {
            total: reservations.length,
            hadir: reservations.filter(r => r.attendance === 'hadir').length,
            tidakHadir: reservations.filter(r => r.attendance === 'tidak hadir').length,
            ragu: reservations.filter(r => r.attendance === 'ragu').length
        };
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Error getting statistics' });
    }
});

// Get list of attendees only
app.get('/api/reservations/attendees', async (req, res) => {
    try {
        const data = await fs.readFile(dataPath, 'utf8');
        const reservations = JSON.parse(data);
        const attendees = reservations.filter(r => r.attendance === 'hadir');
        res.json(attendees);
    } catch (error) {
        res.status(500).json({ error: 'Error getting attendees' });
    }
});

// Delete a reservation (for admin purposes)
app.delete('/api/reservations/:timestamp', async (req, res) => {
    try {
        const data = await fs.readFile(dataPath, 'utf8');
        let reservations = JSON.parse(data);
        
        const timestamp = req.params.timestamp;
        reservations = reservations.filter(r => r.timestamp !== timestamp);
        
        await fs.writeFile(dataPath, JSON.stringify(reservations, null, 2));
        res.json({ message: 'Reservation deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting reservation' });
    }
});

// Initialize data file and start server
initializeDataFile().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
