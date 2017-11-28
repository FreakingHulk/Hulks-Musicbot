const Discord = require("discord.js");
const config = require("./config.json");
const prefix = require("../config.json").prefix
const ytapi = process.env.ytapikey
const search = require('youtube-search');
const YTDL = require("ytdl-core")
const FFMPEG = require("ffmpeg");


var bot = new Discord.Client();
var servers = {};

var opts = {
  maxResults: 1,
  type: "video",
  key: ytapi
};

function play(connect, msg, bot) {
  var server = servers[msg.guild.id];
  console.log(`[PLER] Now started playing music in ${msg.guild.name}`)
  YTDL.getInfo(server.queue[0]).then(info => {
    let em = new Discord.RichEmbed()
      .setColor("7289DA")
      .setAuthor(`${bot.user.username} Music`, bot.user.avatarURL)
      .setThumbnail(info.iurlmq)
      .setDescription(`I will now start playing **${info.title}** in ${connect.channel.name}\n\n**By: **${info.author.name}\n**Requested By:** ${msg.author.tag}`)

    msg.channel.send({
      embed: em
    }).then(m => m.delete(35000))
  });
  server.dispatcher = connect.playStream(YTDL(server.queue[0], {
    filter: "audioonly"
  }));

  server.queue.shift();

  server.dispatcher.on("end", function() {
    if (server.queue[0]) {
      play(connect, msg, bot)
    } else {
      connect.disconnect()
      console.log(`[PLER] Now stopped playing music in ${msg.guild.name}`)
      let em = new Discord.RichEmbed()
        .setColor("7289DA")
        .setAuthor(`I have now stopped playing in ${connect.channel.name}`)

      msg.channel.send({
        embed: em
      }).then(m => m.delete(25000))
    }
  })
};

function removedat(msg) {
  if (msg.channel.type === "dm") return;
  if (!msg.deletable) {
    console.log(`[DEL] Couldn't remove a message in ${msg.guild.name}`)
    return;
  }
  msg.delete();
  console.log(`[DEL] Removed a message in ${msg.guild.name}`)
}

function errorhandle(err) {
  console.log(`[ERROR] ${err}`)
}

console.log(`Now loading RBot Music...`)

bot.on("message", function(message) {
  if (message.author.equals(bot.user)) return;
  if (message.author.bot) return;
  if (!message.content.startsWith(`${prefix}music`)) return;

  var args = message.content.substring(prefix.length + 6).split(" ");

  console.log(args)
  switch (args[0].toLowerCase()) {
    case "help":
      removedat(message)
      let em = new Discord.RichEmbed()
        .setColor("7289DA")
        .setAuthor(`${bot.user.username} Music`, bot.user.avatarURL)
        .setDescription("Fine I'm simply a simple musicbot.")
        .addField(`${prefix}help`, `Sends this message.`)
        .addField(`${prefix}play (Youtube link) or (field)`, `Plays a song in the current channel.`)
        .addField(`${prefix}skip`, `Skips the current song`)
        .addField(`${prefix}stop`, `Skips the current songStops and ends everything`)

      message.channel.send({
        embed: em
      });
      break;
    case "play":
      if (!message.member.voiceChannel) {
        removedat(message)
        message.channel.send(":x: Oh I forgot.. You need to be in a voice channel!")
        break;
      }
      if (!message.member.voiceChannel.joinable || message.member.voiceChannel.full) {
        removedat(message)
        message.channel.send(":x: Looks like I cannot join that voice channel.")
        break;
      }
      if (!args[1]) {
        removedat(message)
        message.channel.send(":x: Umm where's the link?")
        break;
      }
      if (!YTDL.validateURL(args[1])) {
        // message.channel.send(":x: Are you sure thats a Youtube link?")
        search(args.slice(1).join(" "), opts, function(err, results) {
          if (err) return console.log(err);
          if (!servers[message.guild.id]) servers[message.guild.id] = {
            queue: []
          };

          console.log(`[QUEUE] Added music to ${message.guild.name}'s queue!' `)

          var server = servers[message.guild.id]

          server.queue.push(results[0].link);

          if (!message.guild.voiceConnection) message.member.voiceChannel.join().then(function(connection) {
            play(connection, message, bot);
          })
          removedat(message)
        });
      } else {
        if (!servers[message.guild.id]) servers[message.guild.id] = {
          queue: []
        };

        console.log(`[QUEUE] Added music to ${message.guild.name}'s queue!' `)

        var server = servers[message.guild.id]

        server.queue.push(args[1]);

        if (!message.guild.voiceConnection) message.member.voiceChannel.join().then(function(connection) {
          play(connection, message, bot);
        })
        removedat(message)
      }

      break;
    case "skip":
      removedat(message)
      var server = servers[message.guild.id];
      if (server.dispatcher) server.dispatcher.end()
      break;
    case "stop":
      removedat(message)
      var server = servers[message.guild.id];
      if (message.guild.voiceConnection) message.guild.voiceConnection.disconnect();
      break;
    case "leave":
      removedat(message)
      if (!message.member.voiceChannel) {
        message.channel.send(":x: Umm you need to join a channel to be able to use this command...")
        break;
      };;
      if (!message.guild.voiceConnection.channel.name == message.member.voiceChannel.name) {
        message.channel.send(":x: Umm you need to join my channel to use this.")
        break;
      };
      if (message.guild.voiceConnection) message.guild.voiceConnection.disconnect();
      break;
    case "join":
      removedat(message)

      if (!message.member.voiceChannel) {
        message.channel.send(":x: Umm you need to join a channel to be able to use this command...")
        break;
      };;
      if (!message.member.voiceChannel.joinable || message.member.voiceChannel.full) {
        message.channel.send(":x: Looks like I cannot join that voice channel.")
        break;
      }
      message.member.voiceChannel.join()
      break;
    case "l":
      if (!message.author.id == mastid) {
        console.log(`[LEAVE ATTEMPT] ${message.author.username}#${message.author.discriminator} | ${message.guild.name} | ${message.channel.name}`);
        break;
      }
      removedat(message)
      bot.guilds.forEach(async (guil, id) => {
        if (guil.id == args[1]) {
          guil.leave()
          return;
        }
      });
      console.log(`[MANUAL LEAVE] Guild not found!`);
      message.channel.send("Guild wasn't found in my list!")
      break;
  };
  //message.delete();
});

bot.on("ready", function() {
  // Main Print
  console.log(`~~~~~~~~~~~~~  ${bot.user.username}  ~~~~~~~~~~~~~~`);
  console.log(``);
  console.log(`~ Bot Name: ${bot.user.username}`);
  console.log(`~ Prefix: ${config.prefix}`);
  console.log(`~ Serving: ${bot.guilds.array().length} guild(s)`)
  console.log(``);
  console.log(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
  console.log(`${bot.user.username} ready!`);
  console.log(``);
  // Set game
  bot.user.setGame(config.prefix + "help");

});

bot.login(process.env.token)
