const open = require('open');
const axios = require('axios');
const fs = require('fs').promises;
const readline = require('readline');

const rl = readline.createInterface({input: process.stdin, output: process.stdout});

(async function()
{
    try
    {
        const data = await fs.readFile('config.json', 'utf8');
        const config = JSON.parse(data);

        if (!config.apiKey || config.apiKey.trim() === '')
        {
            console.log('APIKEY not found, set it in the configuration file.');
            return;
        }

        for (let id of config.steamIDs)
        {
            const linkPlayerBans = `http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${config.apiKey}&steamids=${id}`;

            try
            {
                const resBans = await axios.get(linkPlayerBans);
                const playerBans = resBans.data.players[0];

                if (!playerBans)
                {
                    console.log(`Error fetching ban data for player: ${id}`);
                    continue;
                }

                if (playerBans.VACBanned || playerBans.CommunityBanned || playerBans.NumberOfGameBans != 0)
                {
                    console.log(`\x1b[31mPlayer: ${id} | ✖\x1b[0m`);

                    const answer = await new Promise(resolve =>
                    {
                        rl.question('\x1b[33mOpen browser link? (Y/N): \x1b[0m', answer =>
                        {
                            resolve(answer);
                        });
                    });

                    if (answer.toUpperCase() === 'Y')
                    {
                        await open(`http://steamcommunity.com/profiles/${id}`);
                    }
                }
                else
                {
                    console.log(`\x1b[32mPlayer: ${id} | ✔\x1b[0m`);
                }
            }
            catch(error)
            {
                console.log(`Error fetching data for player: ${id}`);
            }
        }
    }
    catch(error)
    {
        console.log('The config.json file does not exist.');
        return;
    }
    finally
    {
        rl.close();

        console.log('Press any key to exit...');
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', process.exit.bind(process, 0));
    }
})();