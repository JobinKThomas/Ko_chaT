// import React from 'react';
// import { Typography, AppBar } from '@material-ui/core';
// import { makeStyles } from '@material-ui/core/styles';

// import VideoPlayer from './components/VideoPlayer';
// import Sidebar from './components/Sidebar';
// import Notifications from './components/Notifications';

// const useStyles = makeStyles((theme) => ({
//   appBar: {
//     borderRadius: 15,
//     margin: '30px 100px',
//     display: 'flex',
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     width: '600px',
//     border: '2px solid black',

//     [theme.breakpoints.down('xs')]: {
//       width: '90%',
//     },
//   },
//   image: {
//     marginLeft: '15px',
//   },
//   wrapper: {
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//     width: '100%',
//   },
// }));

// const App = () => {
//   const classes = useStyles();

//   return (
//     <div className={classes.wrapper}>
//       <AppBar className={classes.appBar} position="static" color="inherit">
//         <Typography variant="h2" align="center">Ko_chaT</Typography>
//       </AppBar>
//       <VideoPlayer />
//       <Sidebar>
//         <Notifications />
//       </Sidebar>
//     </div>
//   );
// };

// export default App;

import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AssignmentIcon from "@material-ui/icons/Assignment"
import PhoneIcon from "@material-ui/icons/Phone"
import React, { useEffect, useRef, useState } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import io from "socket.io-client"
import "./App.css"


const socket = io.connect('https://ko-chat.herokuapp.com/')
function App() {
	const [ me, setMe ] = useState("")
	const [ stream, setStream ] = useState()
	const [ receivingCall, setReceivingCall ] = useState(false)
	const [ caller, setCaller ] = useState("")
	const [ callerSignal, setCallerSignal ] = useState()
	const [ callAccepted, setCallAccepted ] = useState(false)
	const [ idToCall, setIdToCall ] = useState("")
	const [ callEnded, setCallEnded] = useState(false)
	const [ name, setName ] = useState("")
	const myVideo = useRef()
	const userVideo = useRef()
	const connectionRef= useRef()

	useEffect(() => {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
			setStream(stream)
				myVideo.current.srcObject = stream
		})

	socket.on("me", (id) => {
			setMe(id)
		})

		socket.on("callUser", (data) => {
			setReceivingCall(true)
			setCaller(data.from)
			setName(data.name)
			setCallerSignal(data.signal)
		})
	}, [])

	const callUser = (id) => {
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("callUser", {
				userToCall: id,
				signalData: data,
				from: me,
				name: name
			})
		})
		peer.on("stream", (stream) => {
			
				userVideo.current.srcObject = stream
			
		})
		socket.on("callAccepted", (signal) => {
			setCallAccepted(true)
			peer.signal(signal)
		})

		connectionRef.current = peer
	}

	const answerCall =() =>  {
		setCallAccepted(true)
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("answerCall", { signal: data, to: caller })
		})
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream
		})

		peer.signal(callerSignal)
		connectionRef.current = peer
	}

	const leaveCall = () => {
		setCallEnded(true)
		connectionRef.current.destroy()
	}

	return (
		<>
			<h1 style={{ textAlign: "center", color: '#fff' }}>Zoomish</h1>
		<div className="container">
			<div className="video-container">
				<div className="video">
					{stream &&  <video playsInline muted ref={myVideo} autoPlay style={{ width: "300px" }} />}
				</div>
				<div className="video">
					{callAccepted && !callEnded ?
					<video playsInline ref={userVideo} autoPlay style={{ width: "300px"}} />:
					null}
				</div>
			</div>
			<div className="myId">
				<TextField
					id="filled-basic"
					label="Name"
					variant="filled"
					value={name}
					onChange={(e) => setName(e.target.value)}
					style={{ marginBottom: "20px" }}
				/>
				<CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
					<Button variant="contained" color="primary" startIcon={<AssignmentIcon fontSize="large" />}>
						Copy ID
					</Button>
				</CopyToClipboard>

				<TextField
					id="filled-basic"
					label="ID to call"
					variant="filled"
					value={idToCall}
					onChange={(e) => setIdToCall(e.target.value)}
				/>
				<div className="call-button">
					{callAccepted && !callEnded ? (
						<Button variant="contained" color="secondary" onClick={leaveCall}>
							End Call
						</Button>
					) : (
						<IconButton color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
							<PhoneIcon fontSize="large" />
						</IconButton>
					)}
					{idToCall}
				</div>
			</div>
			<div>
				{receivingCall && !callAccepted ? (
						<div className="caller">
						<h1 >{name} is calling...</h1>
						<Button variant="contained" color="primary" onClick={answerCall}>
							Answer
						</Button>
					</div>
				) : null}
			</div>
		</div>
		</>
	)
}

export default App
