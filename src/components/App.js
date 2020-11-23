import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import Identicon from 'identicon.js';
import './App.css';
import SocialNetwork from '../abis/SocialNetwork.json';
import Navbar from './Navbar';

const App = () => {
  const [state, setState] = useState({
    account: '',
    socialNetwork: null,
    postCount: 0,
    posts: [],
  });

  const initWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        'Non-Ethereum browser detected. You should consider trying MetaMask!'
      );
    }
  };

  const loadBlockchainData = async () => {
    const web3 = window.web3;

    //Load accounts
    const accounts = await web3.eth.getAccounts();
    console.log(accounts);

    const networkId = await web3.eth.net.getId();
    console.log(networkId);
    const network = SocialNetwork.networks[networkId];
    if (SocialNetwork.networks[networkId]) {
      console.log(network);
      const socialNetwork = web3.eth.Contract(
        SocialNetwork.abi,
        network.address
      );

      const postCount = await socialNetwork.methods.postCount().call();
      console.log(postCount);

      // Load posts
      const postPromises = [];
      for (let i = 1; i <= postCount; i++) {
        postPromises.push(socialNetwork.methods.posts(i).call());
      }

      const posts = await Promise.all(postPromises);
      console.log(posts);

      setState((previousState) => ({
        ...previousState,
        account: accounts[0],
        socialNetwork,
        postCount,
        posts: [...previousState.posts, ...posts],
      }));
    } else {
      alert('SocialNetwork contract not deployed to the detected network.');
    }
  };

  useEffect(() => {
    const init = async () => {
      await initWeb3();
      await loadBlockchainData();
    };
    init();
  }, []);

  return (
    <div>
      <Navbar account={state.account} />
      <div className='container-fluid mt-5'>
        <div className='row'>
          <main
            role='main'
            className='col-lg-12 ml-auto mr-auto'
            style={{ maxWidth: '500px' }}
          >
            <div className='content mr-auto ml-auto'>
              {state.posts.map((post, key) => {
                return (
                  <div className='card mb-4' key={key}>
                    <div className='card-header'>
                      <img
                        alt='Account icon'
                        className='mr-2'
                        width='30'
                        height='30'
                        src={`data:image/png;base64,${new Identicon(
                          post.author,
                          30
                        ).toString()}`}
                      />
                      <small className='text-muted'>{post.author}</small>
                    </div>
                    <ul id='postlist' className='list-group list-group-flush'>
                      <li className='list-group-item'>
                        <p>{post.content}</p>
                      </li>
                      <li key={key} className='list-group-item py-2'>
                        <small className='float-left mt-1 text-muted'>
                          TIPS:{' '}
                          {window.web3.utils.fromWei(
                            post.tipAmount.toString(),
                            'Ether'
                          )}{' '}
                          ETH
                        </small>
                        <button className='btn btn-link btn-sm float-right pt-0'>
                          <span>TIP 0.1 ETH</span>
                        </button>
                      </li>
                    </ul>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
