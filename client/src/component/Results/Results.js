// Node modules
import React, { Component } from "react";
import { Link } from "react-router-dom";

// Components
import Navbar from "../Navbar/Navigation";
import NavbarAdmin from "../Navbar/NavigationAdmin";
import NotInit from "../NotInit";

// Contract
import getWeb3 from "../../getWeb3";
import Election from "../../contracts/Election.json";

// CSS
import "./Results.css";

export default class Result extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ElectionInstance: undefined,
      account: null,
      web3: null,
      isAdmin: false,
      candidateCount: 0,
      candidates: [],
      isElStarted: false,
      isElEnded: false,
    };
  }

  componentDidMount = async () => {
    try {
      // This reload fix can be avoided if not needed:
      if (!window.location.hash) {
        window.location = window.location + "#loaded";
        window.location.reload();
        return;
      }

      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];
      const instance = new web3.eth.Contract(
        Election.abi,
        deployedNetwork && deployedNetwork.address
      );

      this.setState({ web3, ElectionInstance: instance, account: accounts[0] });

      // Fetch candidate count and convert to number
      let candidateCountRaw = await instance.methods.getTotalCandidate().call();
      // candidateCountRaw could be string or BigInt, parse it
      const candidateCount = Number(candidateCountRaw);
      console.log("Candidate Count (raw):", candidateCountRaw);
      console.log("Candidate Count (number):", candidateCount);

      // Fetch election start/end status and convert to boolean
      let startRaw = await instance.methods.getStart().call();
      let endRaw = await instance.methods.getEnd().call();
      // These might be strings "true"/"false" or "1"/"0" or BigInt 0n/1n
      const isElStarted = startRaw === true || startRaw === "true" || startRaw === "1" || startRaw === 1;
      const isElEnded = endRaw === true || endRaw === "true" || endRaw === "1" || endRaw === 1;

      console.log("Election Started (raw):", startRaw, "parsed:", isElStarted);
      console.log("Election Ended (raw):", endRaw, "parsed:", isElEnded);

      // Fetch candidates
      let candidates = [];
      for (let i = 0; i < candidateCount; i++) {
        const candidate = await instance.methods.candidateDetails(i).call();
        console.log(`Candidate ${i + 1} raw:`, candidate);
        candidates.push({
          id: Number(candidate.candidateId), // convert BigInt/string to number
          header: candidate.header,
          slogan: candidate.slogan,
          voteCount: Number(candidate.voteCount), // convert voteCount to number
        });
      }
      console.log("Candidates processed:", candidates);

      // Fetch admin address and check if current user is admin
      const admin = await instance.methods.getAdmin().call();
      const isAdmin = accounts[0].toLowerCase() === admin.toLowerCase();

      this.setState({
        candidateCount,
        candidates,
        isElStarted,
        isElEnded,
        isAdmin,
      });
    } catch (error) {
      console.error("Error loading web3 or contract:", error);
      alert("Failed to load web3, accounts, or contract. See console.");
    }
  };

  render() {
    if (!this.state.web3) {
      return (
        <>
          {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}
          <center>Loading Web3, accounts, and contract...</center>
        </>
      );
    }

    return (
      <>
        {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}
        <br />
        <div>
          {!this.state.isElStarted && !this.state.isElEnded ? (
            <NotInit />
          ) : this.state.isElStarted && !this.state.isElEnded ? (
            <div className="container-item attention">
              <center>
                <h3>The election is being conducted at the moment.</h3>
                <p>Result will be displayed once the election has ended.</p>
                <p>Go ahead and cast your vote {"(if not already)"}.</p>
                <br />
                <Link to="/Voting" style={{ color: "black", textDecoration: "underline" }}>
                  Voting Page
                </Link>
              </center>
            </div>
          ) : !this.state.isElStarted && this.state.isElEnded ? (
            displayResults(this.state.candidates)
          ) : null}
        </div>
      </>
    );
  }
}

function displayWinner(candidates) {
  const getWinner = (candidates) => {
    let maxVoteReceived = 0;
    let winnerCandidates = [];
    for (let i = 0; i < candidates.length; i++) {
      if (candidates[i].voteCount > maxVoteReceived) {
        maxVoteReceived = candidates[i].voteCount;
        winnerCandidates = [candidates[i]];
      } else if (candidates[i].voteCount === maxVoteReceived) {
        winnerCandidates.push(candidates[i]);
      }
    }
    return winnerCandidates;
  };

  const renderWinner = (winner) => (
    <div className="container-winner" key={winner.id}>
      <div className="winner-info">
        <p className="winner-tag">Winner!</p>
        <h2>{winner.header}</h2>
        <p className="winner-slogan">{winner.slogan}</p>
      </div>
      <div className="winner-votes">
        <div className="votes-tag">Total Votes: </div>
        <div className="vote-count">{winner.voteCount}</div>
      </div>
    </div>
  );

  const winnerCandidates = getWinner(candidates);
  return <>{winnerCandidates.map(renderWinner)}</>;
}

export function displayResults(candidates) {
  const renderResults = (candidate) => (
    <tr key={candidate.id}>
      <td>{candidate.id}</td>
      <td>{candidate.header}</td>
      <td>{candidate.voteCount}</td>
    </tr>
  );

  return (
    <>
      {candidates.length > 0 ? <div className="container-main">{displayWinner(candidates)}</div> : null}
      <div className="container-main" style={{ borderTop: "1px solid" }}>
        <h2>Results</h2>
        <small>Total candidates: {candidates.length}</small>
        {candidates.length < 1 ? (
          <div className="container-item attention">
            <center>No candidates.</center>
          </div>
        ) : (
          <>
            <div className="container-item">
              <table>
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Candidate</th>
                    <th>Votes</th>
                  </tr>
                </thead>
                <tbody>{candidates.map(renderResults)}</tbody>
              </table>
            </div>
            <div className="container-item" style={{ border: "1px solid black" }}>
              <center>That is all.</center>
            </div>
          </>
        )}
      </div>
    </>
  );
}
