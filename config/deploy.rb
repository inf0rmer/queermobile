set :application, "queermobile.brunoabrantes.com"
set :repository,  "git@github.com:inf0rmer/queermobile.git"

set :scm, 'git'
set :user, 'brunoabrantes'
set :github_user, 'inf0rmer'
set :branch, "master"
set :git_enable_submodules, 1
set :deploy_via, :remote_cache
set :server_applications_directory, "/srv/www/"
ssh_options[:forward_agent] = true

set :vhost, "#{server_applications_directory}/#{application}"

set (:deploy_to) { "#{vhost}/public_html" }

set :owner, 'brunoabrantes'
set :group, 'www-data'

# =============================================================================
# # ROLES
# # =============================================================================
set :domain, "freya.brunoabrantes.com"
role :app, domain
role :web, domain

namespace :deploy do
  task :start do ; end
  task :stop do ; end
  task :restart do ; end

  desc "Deploy the app"
  task :default do
    update
  end

  desc "Setup and clone the repo."
  task :setup do
    # setup
    sudo "mkdir -p #{vhost}"
    # permissions
    sudo "chown -R #{owner}:#{group} #{vhost}"
    sudo "chmod -R g+w #{vhost}"
    # clone
    run "git clone #{repository} #{deploy_to}"
    # linking
    #sudo "rm -rf #{vhost}/httpdocs"
    #sudo "ln -s #{httpdocs_link} #{vhost}/httpdocs"
    #sudo "chown -R #{user}:#{group} #{vhost}/httpdocs"
  end

  desc "Update the deployed code"
  task :update do
    run "cd #{deploy_to} && git pull origin #{branch}"
    run "perl -pi -e'$t = \"# \" . localtime; s/#\s.*$/$t/e' #{deploy_to}/default.appcache"
  end

  #desc "Rollback a single commit."
  #task :rollback do
  #  set :branch, "HEAD^"
  #  default
  #end
end
