import LoginPage from "./LoginPage";
import { useMemo, useState } from "react";
import "./App.css";


const initialCampaigns = [
  {
    id: 1,
    title: "Student Upkeep",
    description:
      "Help students with finances.",
    category: "Upkeep",
    raised: 4.8,
    goal: 7,
    donors: [
      {
        id: 101,
        displayName: "Amara K.",
        amount: 0.25,
        anonymous: false,
        donatedAt: "Sep 20, 2026",
      },
      {
        id: 102,
        displayName: "",
        amount: 0.1,
        anonymous: true,
        donatedAt: "Sep 21, 2026",
      },
    ],
    daysLeft: 18,
    color: "blue",
    verified: true,
  },
  {
    id: 2,
    title: "Student fees",
    description:
      "Provide healthy meals for children in local schools and learning centers.",
    category: "Education",
    raised: 2.4,
    goal: 5,
    donors: [
      {
        id: 201,
        displayName: "Daniel M.",
        amount: 0.15,
        anonymous: false,
        donatedAt: "Sep 19, 2026",
      },
      {
        id: 202,
        displayName: "",
        amount: 0.2,
        anonymous: true,
        donatedAt: "Sep 22, 2026",
      },
    ],
    daysLeft: 12,
    color: "orange",
    verified: true,
  },
  {
    id: 3,
    title: "Emergency Medical Support",
    description:
      "Support urgent medical treatment and supplies for families in need.",
    category: "Medical",
    raised: 8.1,
    goal: 10,
    donors: [
      {
        id: 301,
        displayName: "Michael R.",
        amount: 0.5,
        anonymous: false,
        donatedAt: "Sep 18, 2026",
      },
    ],
    daysLeft: 27,
    color: "red",
    verified: true,
  },
];


const categories = ["All", "Water", "Education", "Medical"];
function getDonorBadge(amount) {
  if (amount >= 1) {
    return {
      name: "Gold",
      icon: "🏆",
      className: "gold-badge",
    };
  }

  if (amount >= 0.5) {
    return {
      name: "Silver",
      icon: "🥈",
      className: "silver-badge",
    };
  }

  if (amount >= 0.1) {
    return {
      name: "Bronze",
      icon: "🥉",
      className: "bronze-badge",
    };
  }

  return null;
}


function App() {
 const [campaignList, setCampaignList] = useState(initialCampaigns);
 const [activeCategory, setActiveCategory] = useState("All");
 const [walletConnected, setWalletConnected] = useState(false);
 const [selectedCampaign, setSelectedCampaign] = useState(null);
 const [donationAmount, setDonationAmount] = useState("0.10");
 const [showDonorName, setShowDonorName] = useState(true);
 const [donorName, setDonorName] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);


  const filteredCampaigns = useMemo(() => {
  if (activeCategory === "All") {
    return campaignList;
  }

  return campaignList.filter(
    (campaign) => campaign.category === activeCategory
  );
}, [activeCategory, campaignList]);
if (!loggedIn) {
  return <LoginPage onLogin={() => setLoggedIn(true)} />;
}



  function connectWallet() {
    setWalletConnected((currentValue) => !currentValue);
  }

  function openDonationModal(campaign) {
    setSelectedCampaign(campaign);
  }

  function closeDonationModal() {
    setSelectedCampaign(null);
  }

  function submitDonation(event) {
  event.preventDefault();

  if (!walletConnected) {
    connectWallet();
    return;
  }

  const newDonation = {
    id: Date.now(),
    displayName: showDonorName ? donorName || "Community donor" : "",
    amount: Number(donationAmount),
    anonymous: !showDonorName,
    donatedAt: "Sep 25, 2026",
  };

  setCampaignList((currentCampaigns) =>
    currentCampaigns.map((campaign) =>
      campaign.id === selectedCampaign.id
        ? {
            ...campaign,
            raised: campaign.raised + Number(donationAmount),
            donors: [newDonation, ...campaign.donors],
          }
        : campaign
    )
  );

  alert(
    `Donation of ${donationAmount} ETH submitted for ${selectedCampaign.title}.`
  );

  setDonorName("");
  setShowDonorName(true);
  closeDonationModal();
}
if (!loggedIn) {
  return <LoginPage onLogin={() => setLoggedIn(true)} />;
}

  

  return (
     <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">✦</span>
          <span>ChainAid</span>
        </a>

        <nav className="main-navigation">
          <a className="active-link" href="#campaigns">
            Campaigns
          </a>
          <a href="#organizations">Organizations</a>
          <a href="#impact">Impact</a>
          <a href="#governance">Governance</a>
          <a href="#audit-log">Audit Log</a>

        </nav>

        <button className="wallet-button" onClick={connectWallet}>
          <span className="wallet-dot"></span>
          {walletConnected ? "0x82F4...A91F" : "Connect Wallet"}
        </button>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="status-dot"></span>
              Transparent giving on the blockchain
            </div>

            <h1>
              Give with purpose.
              <br />
              <span>Track the impact.</span>
            </h1>

            <p className="hero-description">
              Support verified charity campaigns and follow every donation from
              your wallet to the people it helps.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#campaigns">
                Explore campaigns
              </a>

              <a className="secondary-button" href="#impact">
                View your impact
              </a>
            </div>

            <div className="trust-row">
              <div>
                <strong>342</strong>
                <span>Verified campaigns</span>
              </div>

              <div>
                <strong>18.4K</strong>
                <span>Donors worldwide</span>
              </div>

              <div>
                <strong>126 ETH</strong>
                <span>Funds distributed</span>
              </div>
            </div>
          </div>

          <div className="hero-card">
            <div className="network-label">
              <span className="status-dot"></span>
              Polygon network
            </div>

            <div className="impact-orbit">
              <div className="orbit orbit-one"></div>
              <div className="orbit orbit-two"></div>
              <div className="impact-center">
                <span className="impact-icon">♥</span>
                <strong>100%</strong>
                <small>Transparent</small>
              </div>
            </div>

            <div className="hero-card-footer">
              <span>Every donation is publicly verifiable</span>
              <span className="arrow-icon">↗</span>
            </div>
          </div>
        </section>

        <section className="dashboard-section" id="impact">
          <div className="section-heading">
            <div>
              <p className="section-label">Your dashboard</p>
              <h2>Your blockchain impact</h2>
            </div>

            <button className="text-button">View all activity ↗</button>
          </div>

          <div className="stats-grid">
            <article className="stat-card">
              <span className="stat-icon green-icon">◆</span>
              <p>Total donated</p>
              <strong>0.85 ETH</strong>
              <small>≈ $2,420 USD</small>
            </article>

            <article className="stat-card">
              <span className="stat-icon purple-icon">♧</span>
              <p>People helped</p>
              <strong>420</strong>
              <small>Across 5 campaigns</small>
            </article>

            <article className="stat-card">
              <span className="stat-icon orange-icon">↗</span>
              <p>Transactions</p>
              <strong>12</strong>
              <small>All confirmed</small>
            </article>

            <article className="stat-card highlight-card">
              <span className="stat-icon white-icon">✦</span>
              <p>Impact score</p>
              <strong>92/100</strong>
              <small>Top 8% of donors</small>
            </article>
          </div>
        </section>

        <section className="campaigns-section" id="campaigns">
          <div className="section-heading campaigns-heading">
            <div>
              <p className="section-label">Make a difference</p>
              <h2>Featured campaigns</h2>
            </div>

            <div className="category-tabs">
              {categories.map((category) => (
                <button
                  key={category}
                  className={
                    activeCategory === category ? "tab active-tab" : "tab"
                  }
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="campaign-grid">
            {filteredCampaigns.map((campaign) => {
              const progress = Math.round(
                (campaign.raised / campaign.goal) * 100
              );

              return (
                <article className="campaign-card" key={campaign.id}>
                  <div className={`campaign-image ${campaign.color}`}>
                    <span className="campaign-category">
                      {campaign.category}
                    </span>
                    <span className="campaign-symbol">✦</span>
                  </div>

                  <div className="campaign-content">
                    <div className="verified-label">
                      <span>✓</span>
                      Verified organization
                    </div>

                    <h3>{campaign.title}</h3>

                    <p>{campaign.description}</p>

                    <div className="progress-row">
                      <span>{campaign.raised} ETH raised</span>
                      <strong>{progress}%</strong>
                    </div>

                    <div className="progress-bar">
                      <span style={{ width: `${progress}%` }}></span>
                    </div>


                    <div className="campaign-meta">
  <span>{campaign.donors.length} donors</span>
  <span>{campaign.daysLeft} days left</span>
</div>

<div className="donor-list">
  <div className="donor-list-heading">
    <span>Recent donors</span>
    <span>{campaign.donors.length}</span>
  </div>

  {campaign.donors.slice(0, 3).map((donor) => {
    const donorLabel = donor.anonymous
      ? "Anonymous donor"
      : donor.displayName || "Community donor";
      const donorBadge = getDonorBadge(donor.amount);


    return (
      <div className="donor-row" key={donor.id}>
        <div className="donor-avatar">
          {donor.anonymous
            ? "?"
            : donorLabel.charAt(0).toUpperCase()}
        </div>

        <div className="donor-information">
         <strong>
  {donorLabel}

  {donorBadge && (
    <span className={`donor-badge ${donorBadge.className}`}>
      {donorBadge.icon} {donorBadge.name}
    </span>
  )}
</strong>

<small>{donor.donatedAt}</small>

        </div>

        <span>{donor.amount} ETH</span>
      </div>
    );
  })}
</div>

<div className="campaign-actions">

                      <button
                        className="outline-button"
                        onClick={() => openDonationModal(campaign)}
                      >
                        Details
                      </button>

                      <button
                        className="donate-button"
                        onClick={() => openDonationModal(campaign)}
                      >
                        Donate
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="transparency-section" id="organizations">
          <div>
            <p className="section-label">Blockchain transparency</p>
            <h2>Follow the journey of your donation.</h2>
            <p>
              Each campaign uses a smart contract to record donations and
              provide public transaction history.
            </p>
          </div>

          <div className="chain-flow">
            <div className="chain-step">
              <span>01</span>
              <strong>Your wallet</strong>
              <small>Donation sent</small>
            </div>

            <div className="chain-line"></div>

            <div className="chain-step">
              <span>02</span>
              <strong>Smart contract</strong>
              <small>Funds recorded</small>
            </div>

            <div className="chain-line"></div>

            <div className="chain-step">
              <span>03</span>
              <strong>Local project</strong>
              <small>Impact delivered</small>
            </div>
          </div>
        </section>
        <section className="audit-section" id="audit-log">
  <div className="section-heading">
    <div>
      <p className="section-label">Security and records</p>
      <h2>Audit log</h2>
    </div>

    <button className="text-button">Export records ↗</button>
  </div>

  <div className="audit-table-wrapper">
    <table className="audit-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Action</th>
          <th>User</th>
          <th>Result</th>
          <th>Transaction</th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td>Sep 25, 2026, 14:32</td>
          <td>Donation confirmed</td>
          <td>Demo User</td>
          <td>
            <span className="audit-success">Success</span>
          </td>
          <td>0xabc123...89ef</td>
        </tr>

        <tr>
          <td>Sep 24, 2026, 10:18</td>
          <td>Anonymous setting changed</td>
          <td>Community donor</td>
          <td>
            <span className="audit-success">Success</span>
          </td>
          <td>—</td>
        </tr>

        <tr>
          <td>Sep 23, 2026, 08:47</td>
          <td>Campaign updated</td>
          <td>Organization admin</td>
          <td>
            <span className="audit-success">Success</span>
          </td>
          <td>—</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

      </main>

      <footer className="footer">
        <div className="brand">
          <span className="brand-mark">✦</span>
          <span>ChainAid</span>
        </div>
        <p>Transparent giving for a better world.</p>
        <span>Built for the community</span>
      </footer>

      {selectedCampaign && (
        <div className="modal-backdrop" onClick={closeDonationModal}>
          <div
            className="donation-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="close-button" onClick={closeDonationModal}>
              ×
            </button>

            <p className="section-label">Make a donation</p>
            <h2>{selectedCampaign.title}</h2>
            <p className="modal-description">
              Your donation will be sent through the campaign smart contract.
            </p>

            <form onSubmit={submitDonation}>
              <label htmlFor="donationAmount">Donation amount</label>
                <input    id="donationAmount"    className="donation-amount-input"   
                 type="number"    min="0.01"    step="0.01"    value={donationAmount}   
                 onChange={(event) => setDonationAmount(event.target.value)}    required  />
              <div className="amount-input">
                <label className="donor-name-option">
  <input
    type="checkbox"
    checked={showDonorName}
    onChange={(event) => setShowDonorName(event.target.checked)}
  />

  <span>
    Display my name publicly
    <small>
      Turn this off to appear as an anonymous donor.
    </small>
  </span>
</label>

{showDonorName && (
  <input
    className="donor-name-input"
    type="text"
    placeholder="Enter your display name"
    value={donorName}
    onChange={(event) => setDonorName(event.target.value)}
  />
)}

              </div>

              <div className="fee-row">
                <span>Estimated network fee</span>
                <span>0.002 ETH</span>
              </div>

              <button className="confirm-button" type="submit">
                {walletConnected ? "Confirm donation" : "Connect wallet to donate"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
