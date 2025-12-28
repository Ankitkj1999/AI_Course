import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { User, Admin } from '../models/index.js';

const router = express.Router();

// Initialize email transporter
const getTransporter = () => {
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        service: 'gmail',
        secure: true,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    });
};

// SIGNUP
router.post('/signup', async (req, res) => {
    const { email, mName, password, type } = req.body;

    try {
        const estimate = await User.estimatedDocumentCount();
        if (estimate > 0) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }
            const newUser = new User({ email, mName, password, type });
            await newUser.save();
            res.json({
                success: true,
                message: 'Account created successfully',
                userId: newUser._id
            });
        } else {
            const newUser = new User({
                email,
                mName,
                password,
                type: 'forever',
                isAdmin: true
            });
            await newUser.save();
            const newAdmin = new Admin({ email, mName, type: 'main' });
            await newAdmin.save();
            res.json({
                success: true,
                message: 'Account created successfully',
                userId: newUser._id
            });
        }
    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// SIGNIN
router.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }

        if (password === user.password) {
            try {
                // Generate JWT token
                console.log('Generating JWT token for user:', user.email);
                console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

                const token = jwt.sign(
                    { id: user._id, email: user.email },
                    process.env.JWT_SECRET,
                    { expiresIn: '7d' }
                );

                console.log('Token generated successfully:', !!token);

                // Set httpOnly cookie
                res.cookie('auth_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                });

                return res.json({
                    success: true,
                    message: 'SignIn Successful',
                    userData: { ...user.toObject(), isAdmin: user.isAdmin }
                });
            } catch (error) {
                console.error('JWT generation error:', error);
                return res.json({
                    success: true,
                    message: 'SignIn Successful',
                    userData: { ...user.toObject(), isAdmin: user.isAdmin }
                });
            }
        }

        res.json({ success: false, message: 'Invalid email or password' });
    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Invalid email or password' });
    }
});

// SOCIAL LOGIN (Google/Facebook)
router.post('/social', async (req, res) => {
    const { email, name } = req.body;
    let mName = name;
    let password = '';
    let type = 'free';
    
    try {
        const user = await User.findOne({ email });

        if (!user) {
            const estimate = await User.estimatedDocumentCount();
            if (estimate > 0) {
                const newUser = new User({ email, mName, password, type });
                await newUser.save();

                const token = jwt.sign(
                    { id: newUser._id, email: newUser.email },
                    process.env.JWT_SECRET,
                    { expiresIn: '7d' }
                );

                // Set httpOnly cookie
                res.cookie('auth_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                });

                res.json({
                    success: true,
                    message: 'Account created successfully',
                    userData: newUser
                });
            } else {
                const newUser = new User({ email, mName, password, type });
                await newUser.save();
                const newAdmin = new Admin({ email, mName, type: 'main' });
                await newAdmin.save();

                const token = jwt.sign(
                    { id: newUser._id, email: newUser.email },
                    process.env.JWT_SECRET,
                    { expiresIn: '7d' }
                );

                // Set httpOnly cookie
                res.cookie('auth_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                });

                res.json({
                    success: true,
                    message: 'Account created successfully',
                    userData: newUser
                });
            }
        } else {
            const token = jwt.sign(
                { id: user._id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Set httpOnly cookie
            res.cookie('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            return res.json({
                success: true,
                message: 'SignIn Successful',
                userData: user
            });
        }
    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// LOGOUT
router.post('/logout', (req, res) => {
    try {
        // Clear the httpOnly cookie
        res.clearCookie('auth_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, message: 'Logout failed' });
    }
});

// FORGOT PASSWORD
router.post('/forgot', async (req, res) => {
    const { email, name, company, logo } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        const resetLink = `${process.env.WEBSITE_URL}/reset-password/${token}`;
        const transporter = getTransporter();

        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: `${name} Password Reset`,
            html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
            <html lang="en">
            
              <head></head>
             <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Password Reset<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
             </div>
            
                <body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
                  <tr style="width:100%">
                    <td>
                      <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                        <tbody>
                          <tr>
                            <td><img alt="Vercel" src="${logo}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                          </tr>
                        </tbody>
                      </table>
                      <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Password Reset</h1>
                      <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Click on the button below to reset the password for your account ${email}.</p>
                      <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                        <tbody>
                          <tr>
                            <td><a href="${resetLink}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color: #a855f7;text-align:center;font-size:12px;font-weight:600;color:rgb(255,255,255);text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"</span><span>Reset</span></a></td>
                          </tr>
                        </tbody>
                      </table>
                      <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${company}</strong> Team</p></p>
                      </td>
                  </tr>
                </table>
              </body>
            
            </html>`
        };

        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'Password reset link sent to your email'
        });
    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
    const { password, token } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.json({ success: true, message: 'Invalid or expired token' });
        }

        user.password = password;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        await user.save();

        res.json({
            success: true,
            message: 'Password updated successfully',
            email: user.email
        });
    } catch (error) {
        console.log('Error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default router;