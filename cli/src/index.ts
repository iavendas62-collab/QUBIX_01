#!/usr/bin/env node

import { Command } from 'commander';
import axios from 'axios';
import chalk from 'chalk';
import ora from 'ora';

const API_URL = process.env.QUBIX_API_URL || 'http://localhost:3001';

const program = new Command();

program
  .name('qubix')
  .description('Qubix Compute Hub CLI')
  .version('1.0.0');

// Submit compute job
program
  .command('compute')
  .description('Compute commands')
  .command('submit')
  .option('--model <type>', 'Model type (gpt2, llama, etc)')
  .option('--dataset <path>', 'Dataset path or URL')
  .option('--compute <tflops>', 'Compute needed in TFLOPS', '10')
  .option('--budget <amount>', 'Budget in QUBIC', '100')
  .action(async (options) => {
    const spinner = ora('Submitting job...').start();

    try {
      const res = await axios.post(`${API_URL}/api/jobs/submit`, {
        modelType: options.model,
        dataset: options.dataset,
        computeNeeded: parseInt(options.compute),
        budget: parseFloat(options.budget)
      });

      spinner.succeed(chalk.green('Job submitted successfully!'));
      console.log(chalk.cyan(`Job ID: ${res.data.jobId}`));
      console.log(chalk.gray(`\nCheck status: qubix compute status ${res.data.jobId}`));
    } catch (error: any) {
      spinner.fail(chalk.red('Job submission failed'));
      console.error(error.response?.data || error.message);
    }
  });

// Check job status
program
  .command('status')
  .argument('<jobId>', 'Job ID')
  .action(async (jobId) => {
    const spinner = ora('Fetching job status...').start();

    try {
      const res = await axios.get(`${API_URL}/api/jobs/${jobId}`);
      spinner.stop();

      console.log(chalk.bold('\nJob Status:'));
      console.log(chalk.cyan(`ID: ${res.data.id}`));
      console.log(chalk.cyan(`Status: ${res.data.status}`));
      console.log(chalk.cyan(`Model: ${res.data.modelType}`));
      console.log(chalk.cyan(`Compute: ${res.data.computeNeeded} TFLOPS`));
      console.log(chalk.cyan(`Budget: ${res.data.budget} QUBIC`));
      
      if (res.data.provider) {
        console.log(chalk.green(`\nProvider: ${res.data.provider.address}`));
      }
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to fetch status'));
      console.error(error.response?.data || error.message);
    }
  });

// List models
program
  .command('models')
  .description('List available models')
  .action(async () => {
    const spinner = ora('Fetching models...').start();

    try {
      const res = await axios.get(`${API_URL}/api/models`);
      spinner.stop();

      console.log(chalk.bold('\nAvailable Models:\n'));
      res.data.forEach((model: any) => {
        console.log(chalk.cyan(`${model.name} (${model.modelType})`));
        console.log(chalk.gray(`  ${model.description}`));
        console.log(chalk.yellow(`  Price: ${model.price} QUBIC`));
        console.log(chalk.gray(`  Downloads: ${model.downloads}\n`));
      });
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to fetch models'));
      console.error(error.response?.data || error.message);
    }
  });

program.parse();
