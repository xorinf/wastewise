import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import Campus from '../../models/Campus.js';

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function publicUser(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    campusIds: u.campusIds,
    points: u.points,
    itemsLogged: u.itemsLogged,
  };
}

export async function signup(req, res) {
  const { name, email, password, campusCodes = [] } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const campuses = await Campus.find({ code: { $in: campusCodes } }, '_id');
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    campusIds: campuses.map(c => c._id),
  });
  return res.status(201).json({ token: signToken(user), user: publicUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  return res.json({ token: signToken(user), user: publicUser(user) });
}

export async function me(req, res) {
  return res.json({ user: publicUser(req.user) });
}

export async function linkCampus(req, res) {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'code required' });
  const campus = await Campus.findOne({ code: code.toUpperCase() });
  if (!campus) return res.status(404).json({ error: 'Campus not found' });

  if (!req.user.campusIds.find(id => id.equals(campus._id))) {
    req.user.campusIds.push(campus._id);
    await req.user.save();
  }
  return res.json({ user: publicUser(req.user) });
}
