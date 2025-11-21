# Auth Persistence Migration Plan: `sessionStorage` to `localStorage`

This document outlines the plan to migrate our client-side authentication from `sessionStorage` to `localStorage` to ensure persistent sessions across browser tabs and restarts.

## 1. The Problem

Our React application currently uses `sessionStorage` to store user authentication data. This storage is not persistent and is cleared when a user closes a tab or the browser, leading to a poor user experience.

## 2. The Solution

We will replace all instances of `sessionStorage` with `localStorage` for storing authentication and user data. This will ensure that the user's session remains active until they explicitly log out.

## 3. Affected Files

Based on a codebase search, the following files need to be updated:

- `src/pages/Login.tsx`
- `src/pages/Signup.tsx`
- `src/pages/Profile.tsx`
- `src/pages/PaymentSuccess.tsx`
- `src/pages/PaymentDetails.tsx`
- `src/pages/CoursePage.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Certificate.tsx`
- `src/pages/GenerateCourse.tsx`
- `src/pages/ResetPassword.tsx`
- `src/pages/admin/AdminDashboard.tsx`
- `src/pages/admin/AdminBilling.tsx`
- `src/pages/admin/AdminPrivacy.tsx`
- `src/pages/admin/AdminCancellation.tsx`
- `src/pages/admin/AdminTerms.tsx`
- `src/pages/admin/AdminRefund.tsx`
- `src/pages/dashboard/QuizDashboard.tsx`
- `src/pages/dashboard/QuizList.tsx`
- `src/pages/dashboard/CreateQuiz.tsx`
- `src/components/Header.tsx`
- `src/components/Hero.tsx`
- `src/components/CoursePreview.tsx`
- `src/components/layouts/DashboardLayout.tsx`
- `src/components/layouts/AdminLayout.tsx`
- `src/components/flashcard/FlashcardList.tsx`
- `src/components/flashcard/FlashcardCreator.tsx`
- `src/components/guide/GuideList.tsx`
- `src/components/guide/GuideCreator.tsx`

## 4. Implementation Steps

I will proceed with the following steps:

1.  **Login Page:** Start by updating `src/pages/Login.tsx` to use `localStorage` for setting and getting authentication data.
2.  **Signup Page:** Update `src/pages/Signup.tsx` to use `localStorage` for new user registrations.
3.  **User Profile:** Modify `src/pages/Profile.tsx` to manage user data in `localStorage`.
4.  **Other Components and Pages:** Systematically update the remaining files to use `localStorage`.
5.  **Logout Functionality:** Ensure that the logout functionality correctly clears `localStorage`.

This systematic approach will ensure that all parts of the application consistently use the new storage mechanism.

## 5. Migration Checklist

### Implementation Steps
- [x] 1. **Login Page:** Update `src/pages/Login.tsx` to use `localStorage` for setting and getting authentication data.
- [x] 2. **Signup Page:** Update `src/pages/Signup.tsx` to use `localStorage` for new user registrations.
- [x] 3. **User Profile:** Modify `src/pages/Profile.tsx` to manage user data in `localStorage`.
- [x] 4. **Other Components and Pages:** Systematically update the remaining files to use `localStorage`.
- [x] 5. **Logout Functionality:** Ensure that the logout functionality correctly clears `localStorage`.

### Affected Files
- [x] `src/pages/Login.tsx`
- [x] `src/pages/Signup.tsx`
- [x] `src/pages/Profile.tsx`
- [x] `src/pages/PaymentSuccess.tsx`
- [x] `src/pages/PaymentDetails.tsx`
- [x] `src/pages/CoursePage.tsx`
- [x] `src/pages/Dashboard.tsx`
- [x] `src/pages/Certificate.tsx`
- [x] `src/pages/GenerateCourse.tsx`
- [x] `src/pages/ResetPassword.tsx`
- [x] `src/pages/admin/AdminDashboard.tsx`
- [x] `src/pages/admin/AdminBilling.tsx`
- [x] `src/pages/admin/AdminPrivacy.tsx`
- [x] `src/pages/admin/AdminCancellation.tsx`
- [x] `src/pages/admin/AdminTerms.tsx`
- [x] `src/pages/admin/AdminRefund.tsx`
- [x] `src/pages/dashboard/QuizDashboard.tsx`
- [x] `src/pages/dashboard/QuizList.tsx`
- [x] `src/pages/dashboard/CreateQuiz.tsx`
- [x] `src/components/Header.tsx`
- [x] `src/components/Hero.tsx`
- [x] `src/components/CoursePreview.tsx`
- [x] `src/components/layouts/DashboardLayout.tsx`
- [x] `src/components/layouts/AdminLayout.tsx`
- [x] `src/components/flashcard/FlashcardList.tsx`
- [x] `src/components/flashcard/FlashcardCreator.tsx`
- [x] `src/components/guide/GuideList.tsx`
- [x] `src/components/guide/GuideCreator.tsx`