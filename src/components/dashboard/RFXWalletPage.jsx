import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Home, MapPin, Gamepad2, Wallet, Settings, Plus, Minus,
    Recycle, Trophy, Star, TrendingUp, Send, Users, Gift, Eye, Search, EyeOff, Coins
} from 'lucide-react';
import { ethers } from 'ethers';
import RFXTokenAbi from '../../abi/RFXToken.json'; // adjust path to your ABI

export default function RFXWalletPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('wallet');
    const [showBalance, setShowBalance] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [walletBalance, setWalletBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [userRank, setUserRank] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [claiming, setClaiming] = useState(false);

    const BASE_URL = 'https://rfx-mining-app.onrender.com';

    const iconMap = {
        Game: Gamepad2,
        Campaign: MapPin,
        'Real World': Recycle,
        Bonus: Gift,
        Referral: Users,
        Competition: Trophy,
        Transfer: Send,
    };

    const navItems = [
        { icon: Home, label: 'Home', id: 'home', path: '/dashboard' },
        { icon: MapPin, label: 'Campaign', id: 'campaign', path: '/campaign' },
        { icon: Gamepad2, label: 'Games', id: 'games', path: '/games' },
        { icon: Wallet, label: 'Wallet', id: 'wallet', path: '/wallet' },
        { icon: Settings, label: 'Settings', id: 'settings', path: '/settings' },
    ];

    const periods = ['all', 'today', 'week', 'month'];

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Please log in to access wallet');
                navigate('/dashboard');
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                };

                const userResponse = await fetch(`${BASE_URL}/user/user`, {
                    method: 'GET',
                    headers
                });

                if (!userResponse.ok) throw new Error('Failed to fetch user data');
                const userData = await userResponse.json();

                const transactionsResponse = await fetch(
                    `${BASE_URL}/wallet/transactions?period=${selectedPeriod}&search=${encodeURIComponent(searchQuery)}`,
                    { method: 'GET', headers }
                );

                if (!transactionsResponse.ok) throw new Error('Failed to fetch transactions');
                const transactionsData = await transactionsResponse.json();

                const rankResponse = await fetch(`${BASE_URL}/wallet/rank`, {
                    method: 'GET',
                    headers
                });

                if (!rankResponse.ok) throw new Error('Failed to fetch rank');
                const rankData = await rankResponse.json();

                setWalletBalance(userData.earnings || 0);
                setTransactions(transactionsData.map(tx => ({
                    ...tx,
                    timestamp: new Date(tx.timestamp)
                })));
                setUserRank(rankData.rank);

            } catch (error) {
                console.error('Error fetching data:', error);
                setError(error.message || 'Failed to fetch data');

                if (error.message.includes('Authentication') || error.message.includes('Invalid token')) {
                    localStorage.removeItem('authToken');
                    navigate('/dashboard');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate, selectedPeriod, searchQuery]);

    useEffect(() => {
        const currentNavItem = navItems.find((item) => item.path === location.pathname);
        if (currentNavItem) setActiveTab(currentNavItem.id);
    }, [location.pathname]);

    const todayEarnings = transactions
        .filter((tx) => tx.type === 'earn' && tx.timestamp.toDateString() === new Date().toDateString())
        .reduce((sum, tx) => sum + tx.amount, 0);

    const weekEarnings = transactions
        .filter((tx) => {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return tx.type === 'earn' && tx.timestamp >= weekAgo;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const diff = now - new Date(timestamp);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const formatAmount = (amount) => {
        return amount.toFixed(5);
    };

    // --- CLAIM FUNCTION ---
    const claimDailyRFX = async () => {
        try {
            if (!window.ethereum) {
                alert('Please install MetaMask!');
                return;
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();

            const contractAddress = '0x36A80187397Fa5Fe3cc17061C6cE8E0c1e210C4c'; // replace with your deployed RFX contract
            const rfxContract = new ethers.Contract(contractAddress, RFXTokenAbi.abi, signer);

            setClaiming(true);
            const tx = await rfxContract.claim();
            await tx.wait();

            alert('RFX claimed successfully!');
            setClaiming(false);

            // Update balance after claim
            const balance = await rfxContract.balanceOf(await signer.getAddress());
            setWalletBalance(parseFloat(ethers.formatUnits(balance, 18)));

        } catch (error) {
            console.error(error);
            alert('Claim failed: ' + (error?.data?.message || error.message));
            setClaiming(false);
        }
    };

    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden relative">
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 via-transparent to-transparent"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-green-400 rounded-full animate-float opacity-60"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${8 + Math.random() * 8}s`,
                        }}
                    ></div>
                ))}
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-24">
                {error && (
                    <div className="mb-4 p-4 bg-red-500/20 text-red-400 rounded-lg">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <div className="w-8 h-8 text-gray-400 animate-spin">↻</div>
                        </div>
                        <p className="text-gray-400">Loading wallet data...</p>
                    </div>
                )}

                {!loading && (
                    <>
                        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pt-4 space-y-4 sm:space-y-0">
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center transform rotate-12 transition-transform hover:rotate-0">
                                        <Wallet className="w-8 h-8 text-black" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                                </div>
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent">
                                        My Wallet
                                    </h1>
                                    <p className="text-gray-400 text-sm">Track your RFX token earnings</p>
                                </div>
                            </div>
                        </div>

                        {/* Total Balance Card */}
                        <div className="relative group mb-8">
                            <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all"></div>
                            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-700 overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-green-400/10 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h2 className="text-xl sm:text-2xl font-bold text-white">Total Balance</h2>
                                                <button
                                                    onClick={() => setShowBalance(!showBalance)}
                                                    className="text-gray-400 hover:text-white"
                                                >
                                                    {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                                </button>
                                            </div>

                                            <div className="flex items-baseline space-x-3 mb-4">
                                                <span className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent">
                                                    {showBalance ? `RFX ${formatAmount(walletBalance)}` : 'RFX ••••••'}
                                                </span>
                                            </div>

                                            {/* --- CLAIM BUTTON --- */}
                                            <button
                                                onClick={claimDailyRFX}
                                                disabled={claiming}
                                                className="mt-4 px-4 py-2 bg-green-400 text-black rounded hover:bg-green-500 transition"
                                            >
                                                {claiming ? 'Claiming...' : 'Claim Daily RFX'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                                            <div className="text-gray-400 text-xs mb-1">Today</div>
                                            <div className="text-green-400 font-bold text-lg">+RFX {formatAmount(todayEarnings)}</div>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                                            <div className="text-gray-400 text-xs mb-1">This Week</div>
                                            <div className="text-green-400 font-bold text-lg">+RFX {formatAmount(weekEarnings)}</div>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                                            <div className="text-gray-400 text-xs mb-1">Rank</div>
                                            <div className="text-yellow-400 font-bold text-lg">#{userRank || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Remaining JSX... */}
                        {/* (transactions, earn more RFX section, bottom nav) */}
                        {/* The rest of your original code stays exactly the same */}
                    </>
                )}
                
                {/* Bottom Nav */}
                <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-gray-800 px-4 py-3 z-20">
                    <div className="max-w-lg mx-auto">
                        <div className="flex justify-around items-center">
                            {navItems.map((item) => (
                                <Link
                                    key={item.id}
                                    to={item.path}
                                    className={`group flex flex-col items-center space-y-1 p-2 rounded-xl transition-all ${activeTab === item.id ? 'text-purple-400 bg-purple-400/10' : 'text-gray-400 hover:text-gray-300'
                                        }`}
                                >
                                    <item.icon
                                        className={`w-6 h-6 transition-transform ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'
                                            }`}
                                    />
                                    <span className="text-xs font-medium">{item.label}</span>
                                </Link>
                            ))}
                        </div>

                        <div className="flex justify-center mt-3">
                            <div className="w-32 h-1 bg-white/20 rounded-full"></div>
                        </div>
                    </div>
                </div>

                <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          .animate-float {
            animation: float 8s ease-in-out infinite;
          }
          .delay-1000 {
            animation-delay: 1s;
          }
        `}</style>
            </div>
        </div>
    );
}
