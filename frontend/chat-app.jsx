const { 
    ThemeProvider, 
    createTheme, 
    CssBaseline,
    AppBar,
    Toolbar,
    Typography,
    Container,
    Paper,
    Box,
    TextField,
    IconButton,
    Avatar,
    Chip,
    Card,
    CardContent,
    Fab,
    Tooltip,
    Zoom,
    Grow,
    Slide,
    useMediaQuery
} = MaterialUI;

const { motion, AnimatePresence } = window.FramerMotion || {};

// Custom theme with vibrant colors
const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#6366f1', // Indigo
            light: '#818cf8',
            dark: '#4f46e5',
        },
        secondary: {
            main: '#ec4899', // Pink
            light: '#f472b6',
            dark: '#db2777',
        },
        background: {
            default: '#0f0f23',
            paper: '#1a1a2e',
        },
        success: {
            main: '#10b981',
        },
        warning: {
            main: '#f59e0b',
        },
        error: {
            main: '#ef4444',
        }
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 500,
        }
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
                }
            }
        },
        MuiFab: {
            styleOverrides: {
                root: {
                    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
                }
            }
        }
    }
});

// Message Component with animations
const MessageBubble = ({ message, isOwn, sender }) => {
    const bubbleVariants = {
        hidden: { 
            opacity: 0, 
            scale: 0.8,
            y: 20
        },
        visible: { 
            opacity: 1, 
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 20
            }
        }
    };

    return (
        <motion.div
            variants={bubbleVariants}
            initial="hidden"
            animate="visible"
            style={{
                display: 'flex',
                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                marginBottom: '12px',
                alignItems: 'flex-end'
            }}
        >
            {!isOwn && (
                <Avatar 
                    sx={{ 
                        width: 32, 
                        height: 32, 
                        mr: 1,
                        bgcolor: 'secondary.main',
                        fontSize: '14px'
                    }}
                >
                    {sender?.charAt(0)}
                </Avatar>
            )}
            <Paper
                elevation={3}
                sx={{
                    p: 2,
                    maxWidth: '70%',
                    backgroundColor: isOwn ? 'primary.main' : 'grey.800',
                    color: 'white',
                    borderRadius: isOwn ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    boxShadow: isOwn 
                        ? '0 4px 20px rgba(99, 102, 241, 0.3)' 
                        : '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
            >
                <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                    {message}
                </Typography>
            </Paper>
            {isOwn && (
                <Avatar 
                    sx={{ 
                        width: 32, 
                        height: 32, 
                        ml: 1,
                        bgcolor: 'primary.main',
                        fontSize: '14px'
                    }}
                >
                    You
                </Avatar>
            )}
        </motion.div>
    );
};

// Status Chip Component
const StatusChip = ({ status, partnerName }) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'connected':
                return {
                    label: `Chatting with ${partnerName}`,
                    color: 'success',
                    icon: '💬'
                };
            case 'waiting':
                return {
                    label: 'Looking for someone to chat...',
                    color: 'warning',
                    icon: '🔍'
                };
            case 'connecting':
                return {
                    label: 'Connecting...',
                    color: 'primary',
                    icon: '🔄'
                };
            default:
                return {
                    label: 'Disconnected',
                    color: 'error',
                    icon: '❌'
                };
        }
    };

    const { label, color, icon } = getStatusConfig();

    return (
        <Zoom in={true}>
            <Chip
                label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{icon}</span>
                        <span>{label}</span>
                    </Box>
                }
                color={color}
                variant="filled"
                sx={{
                    fontWeight: 500,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    animation: status === 'waiting' ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.7 }
                    }
                }}
            />
        </Zoom>
    );
};

// Main Chat App Component
const ChatApp = () => {
    const [messages, setMessages] = React.useState([]);
    const [inputValue, setInputValue] = React.useState('');
    const [status, setStatus] = React.useState('connecting');
    const [username, setUsername] = React.useState('');
    const [partnerName, setPartnerName] = React.useState('');
    const [isReady, setIsReady] = React.useState(false);
    
    const messagesEndRef = React.useRef(null);
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Socket event handlers (will be connected to existing socket logic)
    React.useEffect(() => {
        // Hide loading screen once component mounts
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 1000);
        }

        // Expose functions globally so script.js can use them
        window.chatApp = {
            addMessage: (sender, content, isOwn = false) => {
                setMessages(prev => [...prev, { 
                    id: Date.now(), 
                    sender, 
                    content, 
                    isOwn,
                    timestamp: new Date()
                }]);
            },
            setStatus: (newStatus) => setStatus(newStatus),
            setUsername: (name) => setUsername(name),
            setPartnerName: (name) => setPartnerName(name),
            clearMessages: () => setMessages([]),
            setReady: (ready) => setIsReady(ready)
        };
    }, []);

    const handleSendMessage = () => {
        if (inputValue.trim() && window.socket && status === 'connected') {
            window.socket.emit('sendMessage', inputValue);
            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'You',
                content: inputValue,
                isOwn: true,
                timestamp: new Date()
            }]);
            setInputValue('');
        }
    };

    const handleSkip = () => {
        if (window.socket && isReady) {
            window.socket.emit('skip');
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
                sx={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header */}
                <AppBar position="static" elevation={0} sx={{ background: 'rgba(26, 26, 46, 0.9)', backdropFilter: 'blur(10px)' }}>
                    <Toolbar>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            >
                                <Avatar 
                                    src="image/favicon.png" 
                                    sx={{ width: 40, height: 40 }}
                                />
                            </motion.div>
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'primary.light' }}>
                                    Buzzly
                                </Typography>
                            </motion.div>
                        </Box>
                        <StatusChip status={status} partnerName={partnerName} />
                    </Toolbar>
                </AppBar>

                {/* Main Chat Area */}
                <Container maxWidth="md" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', py: 2 }}>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
                    >
                        <Paper 
                            elevation={8}
                            sx={{ 
                                flexGrow: 1, 
                                display: 'flex', 
                                flexDirection: 'column',
                                minHeight: '60vh',
                                overflow: 'hidden',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(99, 102, 241, 0.1)'
                            }}
                        >
                            {/* Messages Area */}
                            <Box 
                                sx={{ 
                                    flexGrow: 1, 
                                    p: 2, 
                                    overflowY: 'auto',
                                    '&::-webkit-scrollbar': {
                                        width: '6px',
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '3px',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        background: 'rgba(99, 102, 241, 0.5)',
                                        borderRadius: '3px',
                                    },
                                }}
                            >
                                <AnimatePresence>
                                    {messages.map((message) => (
                                        <MessageBubble
                                            key={message.id}
                                            message={message.content}
                                            isOwn={message.isOwn}
                                            sender={message.sender}
                                        />
                                    ))}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                                
                                {/* Welcome Message */}
                                {messages.length === 0 && status === 'connected' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{ textAlign: 'center', padding: '40px 20px' }}
                                    >
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            🎉 You're now connected!
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Say hello to {partnerName} and start chatting!
                                        </Typography>
                                    </motion.div>
                                )}
                            </Box>

                            {/* Input Area */}
                            <Box 
                                sx={{ 
                                    p: 2, 
                                    borderTop: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(26, 26, 46, 0.5)'
                                }}
                            >
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        maxRows={3}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder={username ? `${username}, type a message...` : "Type a message..."}
                                        disabled={status !== 'connected'}
                                        variant="outlined"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '20px',
                                                backgroundColor: 'rgba(255,255,255,0.05)',
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'primary.light',
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'primary.main',
                                                },
                                            }
                                        }}
                                    />
                                    <Tooltip title="Send Message">
                                        <Fab 
                                            color="primary" 
                                            size="medium"
                                            onClick={handleSendMessage}
                                            disabled={!inputValue.trim() || status !== 'connected'}
                                            sx={{ minWidth: 56 }}
                                        >
                                            <span className="material-icons">send</span>
                                        </Fab>
                                    </Tooltip>
                                    <Tooltip title="Skip to new partner">
                                        <Fab 
                                            color="secondary" 
                                            size="medium"
                                            onClick={handleSkip}
                                            disabled={!isReady}
                                            sx={{ minWidth: 56 }}
                                        >
                                            <span className="material-icons">shuffle</span>
                                        </Fab>
                                    </Tooltip>
                                </Box>
                            </Box>
                        </Paper>
                    </motion.div>
                </Container>
            </Box>
        </ThemeProvider>
    );
};

// Render the app
ReactDOM.render(<ChatApp />, document.getElementById('app-root'));
