![Header](https://capsule-render.vercel.app/api?type=waving&height=230&section=header&text=FaucetX&fontSize=70&fontColor=ffffff&animation=twinkling&desc=Claim%20Free%20Crypto%20%E2%80%A2%20Auto%20Payouts%20%E2%80%A2%20Leaderboard&descAlignY=72&color=gradient&customColorList=4)

<div align="center">

<img src="https://readme-typing-svg.demolab.com/?font=Fira+Code&weight=600&size=24&pause=1000&color=06B6D4&center=true&vCenter=true&width=700&lines=Claim+Crypto+Every+10+Minutes;Server-Side+Auto+Payouts;Anti-Bot+Captcha+Protection" alt="Typing SVG"/>

**A complete crypto faucet platform - users claim rewards, and the server automatically pays out real on-chain transactions!**

[![LIVE DEMO](https://img.shields.io/badge/🚀_LIVE-faucetx--xt6d.vercel.app-06B6D4?style=for-the-badge&logo=vercel&logoColor=white)](https://faucetx-xt6d.vercel.app)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_+_DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![ethers.js](https://img.shields.io/badge/ethers.js-v6-8B5CF6?style=for-the-badge)](https://docs.ethers.org)
[![Infura](https://img.shields.io/badge/Infura-RPC-FF6C37?style=for-the-badge)](https://infura.io)

</div>

---

## ✨ Features

<div align="center">

[![💧 Claims](https://img.shields.io/badge/💧_Claims-Every_10_Minutes-06B6D4?style=for-the-badge)](#)
[![🧮 Captcha](https://img.shields.io/badge/🧮_Captcha-Anti--Bot_Protection-orange?style=for-the-badge)](#)
[![⚡ Auto Payouts](https://img.shields.io/badge/⚡_Auto_Payouts-On--Chain_TX-green?style=for-the-badge)](#)

[![🏆 Leaderboard](https://img.shields.io/badge/🏆_Leaderboard-Top_Earners-yellow?style=for-the-badge)](#)
[![📜 History](https://img.shields.io/badge/📜_History-Claims_+_Withdraws-teal?style=for-the-badge)](#)
[![🔐 Auth](https://img.shields.io/badge/🔐_Auth-Supabase_Security-purple?style=for-the-badge)](#)

</div>

---

## 🏗️ Architecture

```text
User ──claim──► /api/claim ──► Supabase (balance + timer + captcha check)
   │
   └──withdraw──► /api/withdraw ──► ethers.js signs TX server-side
                                          │
                                          ▼
                                   Infura RPC (Polygon Amoy)
                                          │
                                          ▼
                              User's Wallet (real on-chain payout!)
```

---

## 🛠️ Tech Stack

<div align="center">

[![Next.js 16](https://img.shields.io/badge/Next.js-App_Router_+_API_Routes-black?style=for-the-badge&logo=next.js)](#)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_+_PostgreSQL_+_RLS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](#)
[![ethers.js](https://img.shields.io/badge/ethers.js-Server--Side_Signing-8B5CF6?style=for-the-badge)](#)
[![Tailwind](https://img.shields.io/badge/Tailwind-Glassmorphism_UI-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
[![Infura](https://img.shields.io/badge/Infura-Polygon_Amoy_RPC-FF6C37?style=for-the-badge)](#)

</div>

---

## 📦 Installation

```bash
git clone https://github.com/AbbasFullstack/faucetx.git
cd faucetx/frontend
npm install
npm run dev
```

> 🔑 `.env.local` mein Supabase URL/key, faucet wallet private key aur Infura key zaroori hai

---

## ⚠️ Note

Yeh ek **learning project** hai - payouts **testnet POL** mein hote hain. Asli faucet business ko ad revenue aur funding chahiye hoti hai!

---

## 👨💻 About the Developer

<div align="center">

<img src="https://github.com/AbbasFullstack.png" width="120" height="120" alt="Abbas Hussain"/>

### **Abbas Hussain**
*Full-Stack & Web3 Developer*

[![GitHub](https://img.shields.io/badge/GitHub-AbbasFullstack-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/AbbasFullstack)
[![Email](https://img.shields.io/badge/abbaswebdevelopers@gmail.com-Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:abbaswebdevelopers@gmail.com)

> 📱 **Fun fact:** yeh poora platform sirf mobile phone se banaya gaya hai!

![Contribution Graph](https://ghchart.rshah.org/06B6D4/AbbasFullstack)

</div>

---

<div align="center">

**Made with ❤️ by Abbas Hussain**

⭐ *Star this repo if you find it helpful!*

</div>

![Footer](https://capsule-render.vercel.app/api?type=wave&height=110&section=footer&color=gradient&customColorList=4)